# TransactionsStatistics

对区块链上的数据的一些统计结果

### by_date

基于天的统计

- active_wallet : 活跃钱包数量
- block_number : 区号高度
- coin_base_transaction : the amount of coinbase transaction, for validator/guardian reward
- date : 统计的日期
- deposit_stake_transaction : the amount of deposit stake transaction, for depositing stake to validators/guardians
- latest_block_height : 归属于当天的最新的区块高度
- month : 统计的月份
- release_fund_transaction : the amount of release fund transaction, for off-chain micropayment
- reserve_fund_transaction : the amount of reserve fund transaction, for off-chain micropayment
- send_transaction : the amount of send transaction, for sending tokens among accounts
- service_payment_transaction : the amount of service payment transaction, for off-chain micropayment
- slash_transaction : the amount of slash transaction, for slashing malicious actors
- smart_contract_transaction : the amount of smart contract transaction, for general purpose smart contract
- split_rule_transaction : the amount of split rule transaction, for the "split rule" special smart contract
- theta_fuel_burnt: the amount of theta fuel burnt for transactions.
- timestamp : 当天的最新区块的时间戳
- withdraw_stake_transaction : the amount of withdraw stake transaction, for withdrawing stake from validators/guardians
- year : 统计的年份

**For Example**

```graphql
{
  TransactionsStatistics {
    by_date {
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
      "by_date": [
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

### by_hour

基于小时的统计
**Fields**
Similar to the subfields of the by_date field
