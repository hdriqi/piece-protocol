#!/bin/bash
for i in {1..19}
do
	near view dev-1600392926249-8973539 getReward "{\"userId\": \"${i}\"}" --accountId paras.testnet
done
