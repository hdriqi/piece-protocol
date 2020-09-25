const Near = require('./near')

const main = async () => {
  const userId = process.argv[2]
  if (userId.length > 0) {
    const near = new Near()
    await near.init()
    await near.createAccount(`${userId}.piece.testnet`)
    console.log('Account creation success')
  }
}

main()