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

export type Pool = PersistentDeque<string>
export const mappedPool = new PersistentMap<string, Pool>('mp')
export const mappedReward = new PersistentMap<string, string>('r')
export const mappedProfile = new PersistentMap<string, Profile>('p')
export const vectorProfile = new PersistentVector<string>('vp')

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
	disburse(pool, forSupporter)
	pool.pushFront(userId)
}

function genPoolKey(userId: string): string {
	return 'pool' + '::' + userId
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

function disburse(pool: Pool, forSupporter: u128): void {
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
