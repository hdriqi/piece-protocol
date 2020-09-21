#!/bin/bash
for i in {1..19}
do
	near call dev-1600392926249-8973539 claimReward "{\"userId\": \"${i}\"}" --accountId paras.testnet --gas "100000000000000"
done
