import {
	context,
	PersistentDeque,
	PersistentMap,
	u128,
	ContractPromiseBatch,
	storage,
	PersistentVector,
} from 'near-sdk-as'

const len = 4

const mappedPoolKey = 'm:pool'
const mappedRewardKey = 'm:reward'
const mappedProfileKey = 'm:profile'
const mappedRewardActivityKey = 'm:reward:activity'
const mappedBalanceActivityKey = 'm:balance:activity'
const vectorProfileKey = 'v:profile'

export type Pool = PersistentDeque<string>
export type ActivityList = PersistentVector<Activity>
export const mappedPool = new PersistentMap<string, Pool>(mappedPoolKey)
export const mappedReward = new PersistentMap<string, string>(mappedRewardKey)
export const mappedProfile = new PersistentMap<string, Profile>(
	mappedProfileKey
)
export const mappedRewardActivity = new PersistentMap<string, ActivityList>(
	mappedRewardActivityKey
)
export const mappedBalanceActivity = new PersistentMap<string, ActivityList>(
	mappedBalanceActivityKey
)
export const vectorProfile = new PersistentVector<string>(vectorProfileKey)

@nearBindgen
class Activity {
	from: string
	value: string
	createdAt: u64

	constructor(from: string, value: string) {
		this.from = from
		this.value = value
		this.createdAt = context.blockTimestamp
	}
}

@nearBindgen
class Profile {
	userId: string
	avatar: string
	bio: string

	constructor(userId: string, avatar: string, bio: string) {
		this.userId = userId
		this.avatar = avatar
		this.bio = bio
	}
}

const initKey = 'contract::init'
const ownerKey = 'contract::owner'

export function init(): void {
	assert(
		storage.get<string>(initKey) == null,
		'[PieceProtocol] ALREADY_INITIALIZED'
	)
	storage.set<string>(ownerKey, context.sender)
	storage.set<string>(initKey, 'done')
}

export function getOwner(): string {
	const owner = storage.get<string>(ownerKey)
	if (owner) {
		return owner
	}
	return ''
}

export function setOwner(userId: string): boolean {
	assert(getOwner() == context.sender, '[PieceProtocol] ONLY_OWNER')
	storage.set<string>(ownerKey, userId)
	return true
}

export function getProfileList(page: i32 = 0): Profile[] {
	const limit = 8
	const start = page * limit

	if (start > vectorProfile.length || vectorProfile.length === 0) {
		return []
	}

	const len =
		vectorProfile.length - start > limit ? limit : vectorProfile.length - start

	const profileList: Profile[] = []
	for (let i = start; i < len; i++) {
		const userId: string = vectorProfile[i]
		if (userId) {
			const profile = mappedProfile.get(userId)
			if (profile) {
				profileList.push(profile)
			}
		}
	}
	return profileList
}

export function getRewardActivityList(
	userId: string,
	page: i32 = 0
): Activity[] {
	const limit = 8
	const start = page * limit

	const arr = mappedRewardActivity.get(userId)
	if (!arr) {
		return []
	}
	if (start > arr.length || arr.length === 0) {
		return []
	}

	const len = arr.length - start > limit ? limit : arr.length - start

	const activityList: Activity[] = []
	for (let i = len - 1; i >= start; i--) {
		const activity: Activity = arr[i]
		if (activity) {
			activityList.push(activity)
		}
	}
	return activityList
}

export function getBalanceActivityList(
	userId: string,
	page: i32 = 0
): Activity[] {
	const limit = 8
	const start = page * limit

	const arr = mappedBalanceActivity.get(userId)
	if (!arr) {
		return []
	}
	if (start > arr.length || arr.length === 0) {
		return []
	}

	const len = arr.length - start > limit ? limit : arr.length - start

	const activityList: Activity[] = []
	for (let i = len - 1; i >= start; i--) {
		const activity: Activity = arr[i]
		if (activity) {
			activityList.push(activity)
		}
	}
	return activityList
}

export function getProfile(userId: string): Profile | null {
	const profile = mappedProfile.get(userId)
	if (profile) {
		return profile
	}
	return null
}

export function updateProfile(
	userId: string,
	avatar: string,
	bio: string
): Profile {
	assert(userId == context.sender, '[PieceProtocol] SENDER_NOT_MATCH')
	const newProfile = new Profile(userId, avatar, bio)
	const exist = mappedProfile.get(userId)
	if (!exist) {
		vectorProfile.push(userId)
	}
	mappedProfile.set(userId, newProfile)
	return newProfile
}

export function getReward(userId: string): string {
	const curBal = mappedReward.get(userId)
	if (curBal) {
		return curBal.toString()
	}
	return '0'
}

export function claimReward(): string {
	const curBal = mappedReward.get(context.sender)
	if (curBal) {
		ContractPromiseBatch.create(context.sender).transfer(u128.from(curBal))
		let receiverActivityList = mappedBalanceActivity.get(context.sender)
		const newActivity = new Activity(context.contractName, curBal)

		if (!receiverActivityList) {
			const key = genActivityListKey(context.sender, 'balance')
			const newActivityList = new PersistentVector<Activity>(key)
			receiverActivityList = newActivityList
		}
		receiverActivityList.push(newActivity)
		mappedBalanceActivity.set(context.sender, receiverActivityList)
		return rewardSub(context.sender, curBal)
	}
	return '0'
}

export function piece(receiverId: string): void {
	const userId = context.sender
	assert(receiverId != userId, '[PieceProtocol] CANNOT_SELF_PIECE')
	const value = context.attachedDeposit
	const forOwner: u128 = u128.div10(u128.mul(value, u128.from(9)))
	const forSupporter: u128 = u128.sub(value, forOwner)
	let pool = mappedPool.get(receiverId)
	if (!pool) {
		const poolKey = genPoolKey(receiverId)
		const newPool = new PersistentDeque<string>(poolKey)
		newPool.pushFront(getOwner())
		mappedPool.set(receiverId, newPool)
		pool = newPool
	}

	ContractPromiseBatch.create(receiverId).transfer(forOwner)
	let receiverActivityList = mappedBalanceActivity.get(receiverId)
	const newActivity = new Activity(context.sender, forOwner.toString())

	if (!receiverActivityList) {
		const key = genActivityListKey(receiverId, 'balance')
		const newActivityList = new PersistentVector<Activity>(key)
		receiverActivityList = newActivityList
	}
	receiverActivityList.push(newActivity)
	mappedBalanceActivity.set(receiverId, receiverActivityList)

	disburse(receiverId, pool, forSupporter)
	pool.pushFront(userId)
	mappedPool.set(receiverId, pool)
}

function genActivityListKey(userId: string, type: string): string {
	if (type == 'balance') {
		return 'activity' + '::' + mappedBalanceActivityKey + '::' + userId
	} else {
		return 'activity' + '::' + mappedRewardActivityKey + '::' + userId
	}
}

function genPoolKey(userId: string): string {
	return 'pool' + '::' + mappedPoolKey + '::' + userId
}

function rewardAdd(userId: string, value: string): string {
	const curBal = mappedReward.get(userId)
	const newBal = curBal
		? u128.add(u128.from(curBal), u128.from(value))
		: u128.from(value)
	mappedReward.set(userId, newBal.toString())
	return newBal.toString()
}

function rewardSub(userId: string, value: string): string {
	const curBal = mappedReward.get(userId)
	assert(
		u128.ge(u128.from(curBal), u128.from(value)),
		'[PieceProtocol] NOT_ENOUGH_REWARD_BALANCE'
	)
	const newBal = u128.sub(u128.from(curBal), u128.from(value))
	mappedReward.set(userId, newBal.toString())
	return newBal.toString()
}

function disburse(receiverId: string, pool: Pool, forSupporter: u128): void {
	if (pool.length > 0) {
		const rewardCount: i32 = pool.length > len ? len : pool.length
		const pieceForSupporter = u128.div(forSupporter, u128.from(rewardCount))
		for (let j = 0; j < rewardCount; j++) {
			const userId = pool.popFront()
			rewardAdd(userId, pieceForSupporter.toString())
			pool.pushBack(userId)

			let receiverActivityList = mappedRewardActivity.get(userId)
			const newActivity = new Activity(
				receiverId,
				pieceForSupporter.toString()
			)

			if (!receiverActivityList) {
				const key = genActivityListKey(userId, 'reward')
				const newActivityList = new PersistentVector<Activity>(key)
				receiverActivityList = newActivityList
			}
			receiverActivityList.push(newActivity)
			mappedRewardActivity.set(userId, receiverActivityList)
		}
	}
}
