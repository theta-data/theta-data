# StakeStatistics

返回代币质押的相关统计信息

- block_height : 进行质押统计的区块高度
- effective_guardian_node_number : 在线的守护节点数量
- ctive_guardian_stake_amount : 在线的守护节点的总的 theta 质押数量
- effective_validator_node_number : 在线的验证节点数量
- effective_validator_stake_amount : 在线的验证节点质押的代币数量
- theta_fuel_stake_ratio : Theta Fuel 质押比例
- total_edge_node_stake_amount : 质押到精英边缘节点的 theta fuel 数量
- timestamp : 进行质押统计的区块时间
- total_elite_edge_node_number : 总的精英边缘节点数量
- total_guardian_node_number : 总的守护节点数量
- total_guardian_stake_amount : 总的质押到守护节点的 theta 代币数量
- total_validator_stake_amount ： 总的质押到验证者节点的 theta 代币数量

## 示例

**请求**

```graphql
{
  StakeStatistics {
    theta_stake_ratio
    total_validator_node_number
    block_height
    effective_guardian_node_number
    effective_guardian_stake_amount
    effective_validator_node_number
    effective_validator_stake_amount
    theta_fuel_stake_ratio
    total_edge_node_stake_amount
    timestamp
    total_elite_edge_node_number
    total_guardian_node_number
    total_guardian_stake_amount
    total_validator_stake_amount
  }
}
```

**返回**

```json
{
  "data": {
    "StakeStatistics": {
      "theta_stake_ratio": 0.646273,
      "total_validator_node_number": 16,
      "block_height": 12812401,
      "effective_guardian_node_number": 2116,
      "effective_guardian_stake_amount": "333563168",
      "effective_validator_node_number": 13,
      "effective_validator_stake_amount": "180910499",
      "theta_fuel_stake_ratio": 0.437952,
      "total_edge_node_stake_amount": "2364786672",
      "timestamp": 1636720997,
      "total_elite_edge_node_number": 8425,
      "total_guardian_node_number": 3440,
      "total_guardian_stake_amount": "395862657",
      "total_validator_stake_amount": "250410499"
    }
  }
}
```
