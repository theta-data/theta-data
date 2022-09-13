# SmartContractStatistics

Statistics on smart contract calls

## CallRank

**Parameters**

- rank_by: the order of the returned data
  - call_times: the returned data is sorted descendingly by the total number of calls of all time
  - last_24h_call_times: the returned data is sorted descendingly by the number of calls in the last 24 hours
  - last_seven_days_call_times: the returned data is sorted descendingly by the number of calls in the last 7 days
- take: the number of records

**Fields**

- call_times: total number of smart contract calls
- contract_address: address of the smart contract
- last_24h_call_times: number of smart contract calls in the last 24 hours
- last_seven_days_call_times: number of smart contract calls in the last 7 days
- record: call log
  - timestamp : calling time

**Example**

**Request**

```graphql
{
  SmartContractStatistics {
    CallRank(rank_by: last_24h_call_times, take: 1) {
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

**Response**

```shell
{
  "data": {
    "SmartContractStatistics": {
      "CallRank": [
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
