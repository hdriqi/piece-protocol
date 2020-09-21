#!/bin/bash
for i in {1..19}
do
	near view dev-1600436372176-7862511 getReward "{\"userId\": \"${i}\"}" --accountId paras.testnet
done
