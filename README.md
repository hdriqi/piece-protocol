Piece Protocol
==================

An incentivized protocol both for creators and supporters.


Demo
====

[<img src="https://i.ibb.co/TtDZfms/5f7324b0dd22apiece-thumbnail.png">](https://www.loom.com/share/af2f558cdd2b43e9a8dae1a5d968447f)


Development
===========

1. Prerequisites: Make sure you've installed [Node.js] ≥ 12
2. Install dependencies: `yarn install`
3. You can deploy to near testnet using dev account: `yarn deploy:dev`

Smart Contract
==============

The smart contract was deployed at [dev-v1.piece.testnet](https://explorer.testnet.near.org/accounts/dev-v1.piece.testnet) and written in AssemblyScript.

You can call the smart contract via `near-cli`:

Example:

```bash
near call dev-v1.piece.testnet piece "{\"receiverId\": \"receiver_account_id\"}" --amount "5" --gas "100000000000000" --accountId your_account_id
```

When you call `piece`, make sure to attach minimum 100 Tgas. For other function, you can just attach the default 30 Tgas.

Custom Deployment
=================

`create-account.js` helps you generate a sub-account for your contract deployment. You can just change a few lines of code so that it matches your main test account.