# 介绍

## Theta Data 是什么

Theta Data 从自己运行的 Guardian Node 查询 theta 网络相关数据，
并进行一定的分析整理，再通过 graphql 接口提供出来。让对相关数据感兴趣
的社区成员可以通过一条简单的语句查出自己关心的数据。

对于普通用户，我们有一个简单易用的 Playground，通过简单勾选，就
能查到自己感兴趣的相关数据，并且可以从历史记录中保存相关的查询，下次就不用再重新写语句。

![img](https://raw.githubusercontent.com/larryro/image/main/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20211112111205.png)

对于开发者，相比官方现在提供出来的 js sdk 或者 RPC 接口或者浏览器接口，我们提供了一种更加简单，高效的
数据获取方式。

## 使用 Theta Data 和使用传统数据接口的区别在那里

假设我们需要在主页显示最新的区块高度和当前的 theta 质押信息以及 theta 和 theta fuel 的流通量，

### 通过传统数据接口的方式，需要做这些网络查询操作

1. 通过 js sdk 查出最新的区块高度

```javascript
const provider = new thetajs.providers.HttpProvider()
const blockHeight = await provider.getBlockNumber()
```

2. 通过浏览器接口查询出 Theta 的质押信息(很遗憾，目前没有找到查询 theta fuel 质押信息的接口)

```shell
// Request
curl https://explorer.thetatoken.org:8443/api/stake/totalAmount

// Result
{
  "type":"stakeTotalAmout",
  "body":{
    "totalAmount":"644011157483502419243726104",
    "totalNodes":3457,
    "type":"theta"
    }
}
```

3. 通过 explorer api 查询 theta 的供应量和流通量

```shell
// Request
curl https://explorer.thetatoken.org:8443/api/supply/theta

// Result
{
   "total_supply":1000000000,
   "circulation_supply":1000000000
}
```

4. 通过 explorer api 查询 theta fuel 的供应量和流通量

```shell
// Request
curl https://explorer.thetatoken.org:8443/api/supply/tfuel

// Result
{
   "circulation_supply":5000000000
}
```

可以看到上面至少做了 4 次网络查询，并且接口分布在不同的地方，如果将来提供了 theta fuel 的质押信息接口，
那么可能就是 5 次数据接口查询了

### 如果使用 theta data，需要怎么获取这些数据？

使用 theta data，只需要通过一条 Graphql 语句，就能精确得到你所需要的所有数据，只需要向服务器做一次网络请求。同时还有一个优势，不知道大家有没有注意到，就是通过
这种方式查出来的数据，返回的数据就是你需要的数据，没有任何冗余字段，通过传统的数据接口，多多少少会返回一些自己不需要的冗余数据信息。

```graphql
{
  MarketInformation {
    theta {
      circulating_supply
      total_supply
    }
    theta_fuel {
      circulating_supply
      total_supply
    }
  }
  StakeStatistics {
    total_validator_node_number
    total_guardian_node_number
    total_elite_edge_node_number
  }
  ThetaRpc {
    GetStatus {
      current_height
    }
  }
}
```

返回：

```json
{
  "data": {
    "MarketInformation": {
      "theta": {
        "circulating_supply": 1000000000,
        "total_supply": 1000000000
      },
      "theta_fuel": {
        "circulating_supply": 5301214400,
        "total_supply": 5301214400
      }
    },
    "StakeStatistics": {
      "total_validator_node_number": 16,
      "total_guardian_node_number": 3441,
      "total_elite_edge_node_number": 8436
    },
    "ThetaRpc": {
      "GetStatus": {
        "current_height": "12806717"
      }
    }
  }
}
```

## 你们提供的数据服务可靠么，你们怎么保证数据是准确的，服务是稳定的

我们的核心代码全部是开源的。可以直接通过查看源码来了解相关的数据是怎么进行统计的。
[https://github.com/theta-data/theta-data-api](https://github.com/theta-data/theta-data-api)

除了市场相关的数据是从 coinmarketcap 查询获取的，我们所有的其他数据都是从我们自己运行的
Guardian Node 查询分析得来，所以我们的数据服务几乎不依赖第三方数据接口的服务稳定性。

如果你有非常大规模的数据请求量，认为我们目前的服务部署不足以支撑你的数据服务，由于我们现在
还没有收取接口调用的服务费用，您也可以直接将我们的数据服务部署到你的私人服务器上面，直接从您的 Guardian Node 来查询统计获得相关数据。我们的数据服务代码
是基于 MIT 协议。
