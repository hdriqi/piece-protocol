#!/bin/bash
for i in {1..19}
do
	near call dev-1600392926249-8973539 piece "{\"userId\": \"${i}\"}" --gas "300000000000000" --accountId paras.testnet
done
