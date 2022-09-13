# SmartContractStatistics

统计智能合约的相关调用情况

### call_rank

**参数**

- rank_by : 返回的数据的排序方式
  - call_times：返回数据通过总调用次数从高到低排序
  - last_24h_call_times ： 返回数据通过过去 24 小时的调用次数从高到低排序
  - last_seven_days_call_times ： 返回数据通过过去 7 天的调用次数从高到低排序
- take : 返回记录条数

**字段**

- call_times ： 智能合约总的被调用次数
- contract_address ： 智能合约的地址
- create_date ： 记录创建时间
- last_24h_call_times ： 智能合约过去 24 小时的调用次数
- last_seven_days_call_times：智能合约过去 7 天的调用次数
- update_date ： 记录更新时间
- record : 调用记录
  - timestamp : 调用时间

## 示例

**请求：**

```graphql
{
  SmartContractStatistics {
    call_rank(rank_by: last_24h_call_times, take: 1) {
      contract_address
      call_times
      last_24h_call_times
      last_seven_days_call_times
      record {
        timestamp
      }
    }
  }
}
```

**返回**

```shell
{
  "data": {
    "SmartContractStatistics": {
      "call_rank": [
        {
          "contract_address": "0x14ca082c412bf5530aadb07d54aaa64b6e205a74",
          "call_times": 32520,
          "create_date": 1634197751031,
          "id": 6,
          "last_24h_call_times": 977,
          "last_seven_days_call_times": 5383,
          "update_date": 1636704063000,
          "record": [...]
        }
      ]
    }
  }
}

```
