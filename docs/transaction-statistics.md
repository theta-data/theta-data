# TransactionsStatistics

Statistics of transaction records on the blockchain

## ByDate

Daily statistics

**Fields**
- active_wallet: number of active wallets
- block_number: block height
- coin_base_transaction: the amount of coinbase transaction, for validator/guardian reward
- date: date of statistics
- deposit_stake_transaction: the amount of deposit stake transaction, for deposit stake to validators/guardians
- latest_block_height: the latest block height attributed to date
- month: month of statistics
- release_fund_transaction: the number of release fund transactions, for off-chain micropayment
- reserve_fund_transaction: the number of reserve fund transactions, for off-chain micropayment
- send_transaction: the number of send transactions, for sending tokens among accounts
- service_payment_transaction: the number of service payment transactions, for off-chain micropayment
- slash_transaction: the number of slash transactions, for slashing malicious actors
- smart_contract_transaction: the number of smart contract transactions, for general purpose smart contract
- split_rule_transaction: the number of split rule transactions, for the "split rule" special smart contract
- theta_fuel_burnt: the number of theta fuel burnt for transactions.
- timestamp: timestamp of the latest block of the day
- withdraw_stake_transaction: the number of withdraw stake transactions, for withdrawing stake from validators/guardians
- year: year of statistics

**For Example**

```graphql
{
  TransactionsStatistics {
    ByDate {
      active_wallet
      block_number
      coin_base_transaction
      date
      deposit_stake_transaction
      latest_block_height
      month
      release_fund_transaction
      reserve_fund_transaction
      send_transaction
      service_payment_transaction
      slash_transaction
      smart_contract_transaction
      split_rule_transaction
      theta_fuel_burnt
      timestamp
      withdraw_stake_transaction
      year
    }
  }
}
```

**_Response_**

```json
{
  "data": {
    "TransactionsStatistics": {
      "ByDate": [
        {
          "active_wallet": 252,
          "block_number": 579,
          "coin_base_transaction": 579,
          "date": 31,
          "deposit_stake_transaction": 0,
          "latest_block_height": 12647892,
          "month": 10,
          "release_fund_transaction": 0,
          "reserve_fund_transaction": 0,
          "send_transaction": 372,
          "service_payment_transaction": 0,
          "slash_transaction": 0,
          "smart_contract_transaction": 69,
          "split_rule_transaction": 0,
          "theta_fuel_burnt": 116.65,
          "timestamp": "1635692400000",
          "withdraw_stake_transaction": 6,
          "year": 2021
        }
      ]
    }
  }
}
```

## ByHour

Hourly statistics

**Fields**

Similar to the subfields of the `by_date` field
