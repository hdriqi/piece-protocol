import { genUser, getReward, piece } from "../main"

describe("Main ", () => {
	it("should create run piece", () => {
		const m = 20
		genUser(0, m)

		for (let i = 1; i < m; i++) {
			piece(i.toString())
    }

    for (let i = 1; i < m; i++) {
			log(getReward(i.toString()))
    }
	})
})
