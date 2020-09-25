const fs = require('fs')
const { KeyPair, connect } = require('near-api-js');
const { parseNearAmount } = require('near-api-js/lib/utils/format');
const homedir = require('os').homedir()
const path = require('path')
const { UnencryptedFileSystemKeyStore } = require('near-api-js').keyStores

const CREDENTIALS_DIR = '.near-credentials';
const credentialsPath = path.join(homedir, CREDENTIALS_DIR)

const config = require('./config')(
	process.env.NODE_ENV || 'development'
)

class Near {
	constructor() {
		this.ctx = null
		this.masterAccount = null
	}

	async init() {
		const near = await connect({
			deps: {
				keyStore: new UnencryptedFileSystemKeyStore(credentialsPath),
			},
			...config,
		})
		this.ctx = near
		this.masterAccount = await near.account('piece.testnet')
	}

	async createAccount(newAccId) {
		const keyPair = KeyPair.fromRandom('ed25519')
		const newAccount = await this.masterAccount.createAccount(
			newAccId,
      keyPair.publicKey.toString(),
      parseNearAmount('100')
    )
    const account = {
      account_id: newAccId,
      public_key: `ed25519:keyPair.publicKey.toString()`,
      private_key: `ed25519:${keyPair.secretKey}`
    }

    fs.writeFileSync(path.join(credentialsPath, `default`, `${newAccId}.json`), JSON.stringify(account))
    
		return newAccount
	}

	async deployContract(contractId) {
    const contractAcc = await this.ctx.account(contractId)
		console.log('Setting up and deploying contract')
		const contractPath = path.join(process.cwd(), 'out/main.wasm')
		await contractAcc.deployContract(
			require('fs').readFileSync(contractPath)
		)
		console.log(`Contract ${contractAcc.accountId} deployed`)
	}
}

module.exports = Near
