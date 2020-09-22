import {
	context,
	PersistentDeque,
	PersistentMap,
	u128,
	ContractPromiseBatch,
} from 'near-sdk-as'

const len = 4

export const mappedPool = new PersistentMap<string, PersistentDeque<string>>(
	'mp'
)
export const reward = new PersistentMap<string, string>('r')

// export function clearPool(): void {
// 	for (let i = 0; i < pool.length; i++) {
// 		pool.popFront()
// 	}
// }

// export function getPool(): string[] {
// 	const data: string[] = []
// 	for (let i = 0; i < pool.length; i++) {
// 		data.push(pool[i])
// 	}
// 	return data
// }

export function getReward(userId: string): string {
	const curBal = reward.get(userId)
	if (curBal) {
		return curBal.toString()
	}
	return '0'
}

export function claimReward(userId: string): string {
	const curBal = reward.get(userId)
	if (curBal) {
		ContractPromiseBatch.create(context.sender).transfer(u128.from(curBal))
		return rewardSub(userId, curBal)
	}
	return '0'
}

export function piece(receiverId: string): void {
	const userId = context.sender
	const value = context.attachedDeposit
	const forOwner: u128 = u128.div10(u128.mul(value, u128.from(9)))
	const forSupporter: u128 = u128.sub(value, forOwner)
	const poolId = getPoolId(receiverId)
	const pool = mappedPool.get(poolId)
	if (pool) {
		if (pool.length > 0) {
			ContractPromiseBatch.create(receiverId).transfer(forOwner)
			disburse(pool, forSupporter)
		} else {
			ContractPromiseBatch.create(receiverId).transfer(value)
		}
		pool.pushFront(userId)
	} else {
		const newPool = new PersistentDeque<string>(poolId)
		newPool.pushFront(userId)
		mappedPool.set(receiverId, newPool)
	}
}

function getPoolId(userId: string): string {
	return 'pool' + '::' + userId
}

function rewardAdd(userId: string, value: string): string {
	const curBal = reward.get(userId)
	const newBal = curBal
		? u128.add(u128.from(curBal), u128.from(value))
		: u128.from(value)
	reward.set(userId, newBal.toString())
	return newBal.toString()
}

function rewardSub(userId: string, value: string): string {
	const curBal = reward.get(userId)
	assert(
		u128.ge(u128.from(curBal), u128.from(value)),
		'[KarmaProtocol] NOT_ENOUGH_REWARD_BALANCE'
	)
	const newBal = u128.sub(u128.from(curBal), u128.from(value))
	reward.set(userId, newBal.toString())
	return newBal.toString()
}

function disburse(pool: PersistentDeque<string>, forSupporter: u128): void {
	if (pool.length > 0) {
		const rewardCount: i32 = pool.length > len ? len : pool.length
		const pieceForSupporter = u128.div(forSupporter, u128.from(rewardCount))
		for (let j = 0; j < rewardCount; j++) {
			const userId = pool.popFront()
			rewardAdd(userId, pieceForSupporter.toString())
			pool.pushBack(userId)
		}
	}
}
