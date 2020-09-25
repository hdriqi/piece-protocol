// import { genUser, getReward, piece } from "../main"

import { getProfile, getProfileList, piece, updateProfile } from '../main'

describe('Main ', () => {
	// it("should create run piece", () => {
	// 	const m = 20
	// 	genUser(0, m)

	// 	for (let i = 1; i < m; i++) {
	// 		piece(i.toString())
	//   }

	//   for (let i = 1; i < m; i++) {
	// 		log(getReward(i.toString()))
	//   }
	// })

	it('should update and get profile', () => {
		updateProfile('bob', 'avatar', 'bio')
		const newProfile = getProfile('bob')
		expect(newProfile).toBeTruthy()
		if (newProfile) {
			expect(newProfile.userId).toBe('bob')
			expect(newProfile.avatar).toBe('avatar')
			expect(newProfile.bio).toBe('bio')
		}

		const profileList = getProfileList(0)
		expect(profileList.length).toBe(1)
	})

	// it('should getProfile', () => {
	// 	updateProfile('bob', 'avatar', 'bio')
	// 	const newProfile = getProfile('bob')
	// 	log(newProfile)
	// 	// expect(newProfile.userId).toBe('bob')
	// })
})
