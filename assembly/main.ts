import {
	context,
	PersistentDeque,
	PersistentMap,
	PersistentVector,
	u128,
} from "near-sdk-as"

const member = 10
const price = 500
const len = 4

export const pool = new PersistentDeque<string>("p")
export const balance = new PersistentMap<string, string>("b")
export const reward = new PersistentMap<string, string>("r")

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
		"[KarmaProtocol] NOT_ENOUGH_REWARD_BALANCE"
	)
	const newBal = u128.sub(u128.from(curBal), u128.from(value))
	reward.set(userId, newBal.toString())
	return newBal.toString()
}

function balanceAdd(userId: string, value: string): string {
	const curBal = balance.get(userId)
	const newBal = u128.add(u128.from(curBal), u128.from(value))
	balance.set(userId, newBal.toString())
	return newBal.toString()
}

function balanceSub(userId: string, value: string): string {
	const curBal = balance.get(userId)
	assert(
		curBal || u128.ge(u128.from(curBal), u128.from(value)),
		"[KarmaProtocol] NOT_ENOUGH_BALANCE"
	)
	const newBal = u128.sub(u128.from(curBal), u128.from(value))
	balance.set(userId, newBal.toString())
	return newBal.toString()
}

function disburse(forSupporter: u128): void {
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



export function init(): void {
	for (let i = 0; i < member; i++) {
		balance.set(i.toString(), u128.from(10000).toString())
	}
}

export function genUser(start: i32, end: i32): void {
	for (let i = start; i < end; i++) {
		balance.set(i.toString(), u128.from(10000).toString())
	}
}

export function clearPool(): void {
	for (let i = 0; i < pool.length; i++) {
		pool.popFront()
	}
}

export function getPool(): string[] {
	const data: string[] = []
	for (let i = 0; i < pool.length; i++) {
		data.push(pool[i])
	}
	return data
}

export function getBalance(userId: string): string {
	const curBal = balance.get(userId)
	if (curBal) {
		return curBal.toString()
	}
	return "0"
}

export function getReward(userId: string): string {
	const curBal = reward.get(userId)
	if (curBal) {
		return curBal.toString()
	}
	return "0"
}

export function claimReward(userId: string): string {
	const curBal = reward.get(userId)
	if (curBal) {
		balanceAdd(userId, curBal)
		return rewardSub(userId, curBal)
	}
	return "0"
}

export function piece(userId: string): void {
	const forOwner: u128 = u128.div10(u128.mul(u128.from(price), u128.from(8)))
	const forSupporter: u128 = u128.sub(u128.from(price), forOwner)
	balanceSub(userId, price.toString())
	if (pool.length > 0) {
		balanceAdd("0", forOwner.toString())
		disburse(forSupporter)
	} else {
		balanceAdd("0", price.toString())
	}
	pool.pushFront(userId)
}
