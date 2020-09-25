#!/bin/bash
for i in {1..19}
do
	near call dev-1600928534148-2028063 piece "{\"receiverId\": \"himan.testnet\"}" --gas "1000000000000000" --accountId paras.testnet
done
