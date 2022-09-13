# ThetaRpc

## GetAccount

This field returns the details of account.

- code: the hash of the smart contract bytecode (for smart contract accounts)
- coins: the native token balance
- reserved_funds: fund reserved for micropayment through the off-chain resource-oriented payment pool
- root: the root hash of the data Merkle-Patricia trie (for smart contract accounts)
- sequence: the current sequence number of the account

#### Example

```graphql
{
  ThetaRpc {
    GetAccount(address: "0x96b9b7c2d8b1b5b315155cfb3cd17b54d867c773") {
      code
      coins {
        tfuelwei
        thetawei
      }
      last_updated_block_height
      reserved_funds
      root
      sequence
    }
  }
}
```

**Response**

```json
{
  "data": {
    "ThetaRpc": {
      "GetAccount": {
        "code": "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
        "coins": {
          "tfuelwei": "2163521382670000000000",
          "thetawei": "2659783981670000000000"
        },
        "last_updated_block_height": "10444009",
        "reserved_funds": [],
        "root": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "sequence": "7"
      }
    }
  }
}
```

## GetBlock

This field returns the details of the block.

**Query Parameters**

- hash: the block hash

**Fields**

- chain_id: ID of the chain
- epoch: epoch of the block
- height: height of the block
- parent: hash of the parent block
- transactions_hash: root hash of the transaction Merkle-Patricia trie
- state_hash: root hash of the state Merkle-Patricia trie
- timestamp: timestamp when the block was proposed
- proposer: address of the proposer validator
- children: children blocks
- hash: the block hash
- transactions: the transactions in the block in json format
- raw: transaction details
- type: type of the transaction (see the Transaction Types note below)
  - TxCoinbase: coinbase transaction, for validator/guardian reward
  - TxSlash: slash transaction, for slashing malicious actors
  - TxSend: send transaction, for sending tokens among accounts
  - TxReserveFund: reserve fund transaction, for off-chain micropayment
  - TxReleaseFund: release fund transaction, for off-chain micropayment
  - TxServicePayment: service payment transaction, for off-chain micropayment
  - TxSplitRule: split rule transaction, for the "split rule" special smart contract
  - TxSmartContract: smart contract transaction, for general purpose smart contract
  - TxDepositStake: deposit stake transaction, for deposit stake to validators/guardians
  - TxWithdrawStake: withdraw stake transaction, for withdrawing stake from validators/guardians
  - TxDepositStakeV2: v2 deposit stake transaction
  - TxStakeRewardDistribution: transactions that specify the stake fee
- hash: hash of the transaction
- status: status of the block (see the Block Status note below)
  - pending
  - valid
  - invalid
  - committed
  - directly_finalized
  - indirectly_finalized
  - trusted

#### Example

```graphql
{
  ThetaRpc {
    GetBlock(hash: "0x4af27e43da47a7398fe904967f002268e14d48f6e226a15f0333997aaa37ce7b") {
      chain_id
      children
      epoch
      hash
      height
      parent
      proposer
      state_hash
      status
      timestamp
      transactions_hash
      transactions {
        type
        hash
      }
    }
  }
}
```

**Response**

```json
{
  "data": {
    "ThetaRpc": {
      "GetBlock": {
        "chain_id": "mainnet",
        "children": ["0x232ee6c1901c6ddd960aacded97268664b2d83d034f1a828585948f71314b757"],
        "epoch": "12895514",
        "hash": "0x4af27e43da47a7398fe904967f002268e14d48f6e226a15f0333997aaa37ce7b",
        "height": "12812680",
        "parent": "0x1d6721f1e2d88bf5c8c89a6ee00d96d5b0b065706a4d60d3972ba0a27d1c16ef",
        "proposer": "0xcbcef62ca7a2e367a9c93aba07ea4e63139da99d",
        "state_hash": "0x63fb02fa46694160c31485628da6d7830db438817f402d817ad661c4e2617f98",
        "status": "directly_finalized",
        "timestamp": "1636722729",
        "transactions_hash": "0x6166e704b2cf37e4c85faa9ed00a176161c8fc835b1c9b812f58266c2c961b24",
        "transactions": [
          {
            "type": "TxCoinbase",
            "hash": "0x16df2d1fd50fe2bbe3c0ff0b15bdd69dd0ddb3e4bb751d9772e38e8cb3440c76"
          },
          {
            "type": "TxSmartContract",
            "hash": "0x37670692b97a9fb5ff018b5e9f38f6e793078bfe38565c9ec1b064bde13f6db4"
          },
          {
            "type": "TxSmartContract",
            "hash": "0xb592df01962244c7e31a5a3d40976340b9705bf3e61f5d3623df634396e55a3e"
          }
        ]
      }
    }
  }
}
```

## GetBlockByHeight

This field returns the finalized block given the height.
If none of the blocks at the given height are finalized (either directly or indirectly), an empty result will be returned.

**Query Parameters**

- height: the block height (if no height parameter is provided, the latest finalized block will be returned)

**Fields**

The result of this field is similar to that of the `GetBlock` field.

## GetEenpByHeight

This field returns the information of the elite edge node.

**Query Parameters**

- height: the block height, optional. By default, the height of the latest finalized block will be returned.

**Fields**

- BlockHashEenpPairs
  - HeightList
  - BlockHash
  - EENs

**Example**

```graphql
{
  ThetaRpc {
    GetEenpByHeight {
      BlockHashEenpPairs {
        EENs {
          Holder
        }
        HeightList {
          Heights
        }
      }
    }
  }
}
```

**Response**

```shell
{
  "data": {
    "ThetaRpc": {
      "GetEenpByHeight": {
        "BlockHashEenpPairs": [
          {
            "EENs":[
              {
                "Holder": "0x0000a888ae9e34075ee90ef5bc4906e871d874cd"
              },
              ...
              {
                "Holder": "0x0001a888aa09d244f2d66437fa22f0aaaf9916fb"
              },
            ],
            "HeightList": null
          }
        ]
      }
    }
  }
}
```

## GetGcpByHeight

This field returns the information of the guardian node.

**Query Parameters**

- height: the block height, optional. By default, the height of the latest finalized block will be returned.

**Fields**

- BlockHashGcpPairs
  - BlockHash
  - Gcp
  - HeightList

**Example**

```graphql
{
  ThetaRpc {
    GetGcpByHeight {
      BlockHashGcpPairs {
        BlockHash
        Gcp {
          SortedGuardians {
            Holder
          }
        }
        HeightList {
          Heights
        }
      }
    }
  }
}
```

**Response**

```shell
{
  "data": {
    "ThetaRpc": {
      "GetGcpByHeight": {
        "BlockHashGcpPairs": [
          {
            "BlockHash": "0xa1a12da8a3a8a8c732b3f0af648a7db26817d52d8af33d68f062513da3eef7ec",
            "Gcp": {
              "SortedGuardians":[
               {
                  "Holder": "0x0008b98bd392e023bec03f9d611741b1d2152d4b"
                },
                ...
                 {
                  "Holder": "0x005d4ea80bd1fc6df1852fd41d5c62f24e9171ac"
                }
              ]
            },
            "HeightList": null
          }
        ]
      }
    }
  }
}
```

## GetPendingTransactions

- tx_hashes: the hashes of the transactions pending in the mempool\*

**Example**

```graphql
{
  ThetaRpc {
    GetPendingTransactions {
      tx_hashes
    }
  }
}
```

**Response**

```json
{
  "data": {
    "ThetaRpc": {
      "GetPendingTransactions": {
        "tx_hashes": ["0x61ed06b78fededbbd262f95f321d7e48dee81e9b1e493b7f4d42c6bf7afd4b27"]
      }
    }
  }
}
```

## GetStakeRewardDistributionByHeight

This field returns the information of the node stake split rule.

**Query Parameters**

- height: the block height, optional. By default, the height of the latest finalized block will be returned.

**Fields**

- BlockHashStakeRewardDistributionRuleSetPairs
  - BlockHash
  - StakeRewardDistributionRuleSet
    - Beneficiary
    - SplitBasisPoint
    - StakeHolder

**Example**

```graphql
{
  ThetaRpc {
    GetStakeRewardDistributionByHeight {
      BlockHashStakeRewardDistributionRuleSetPairs {
        BlockHash
        StakeRewardDistributionRuleSet {
          Beneficiary
          SplitBasisPoint
          StakeHolder
        }
      }
    }
  }
}
```

```shell
{
  "data": {
    "ThetaRpc": {
      "GetStakeRewardDistributionByHeight": {
        "BlockHashStakeRewardDistributionRuleSetPairs": [
          {
            "BlockHash": "0x9dfd80e6e846e923c3542220fc2a21cdc14d7b0e5703f514cf0e30199b605bd6",
            "StakeRewardDistributionRuleSet": [
              {
                "Beneficiary": "0x88881888814d847a97c1d6b9a612056806128888",
                "SplitBasisPoint": "400",
                "StakeHolder": "0x0000a888ae9e34075ee90ef5bc4906e871d874cd"
              }
              ...
              ]
          }
        ]
      }
    }
  }
}
```

## GetStatus

This field returns the status of the guardian node run by theta data

- current_height
- address
- genesis_block_hash
- chain_id
- current_epoch
- current_time
- latest_finalized_block_epoch
- latest_finalized_block_height
- latest_finalized_block_hash
- latest_finalized_block_time
- peer_id
- syncing

**Example**

```graphql
{
  ThetaRpc {
    GetStatus {
      current_height
      address
      genesis_block_hash
      chain_id
      current_epoch
      current_time
      latest_finalized_block_epoch
      latest_finalized_block_height
      latest_finalized_block_hash
      latest_finalized_block_time
      peer_id
      syncing
    }
  }
}
```

**_Response_**

```json
{
  "data": {
    "ThetaRpc": {
      "GetStatus": {
        "current_height": "12837074",
        "address": "0x1676d4D39cbC7519De75878765Fdde964B432732",
        "genesis_block_hash": "0xd8836c6cf3c3ccea0b015b4ed0f9efb0ffe6254db793a515843c9d0f68cbab65",
        "chain_id": "mainnet",
        "current_epoch": "12919942",
        "current_time": "1636875019",
        "latest_finalized_block_epoch": "12919940",
        "latest_finalized_block_height": "12837074",
        "latest_finalized_block_hash": "0xb75a5e37d609d285f1d953d0691a76e81e85e170e59cd50eae4e1a3a86844f76",
        "latest_finalized_block_time": "1636875002",
        "peer_id": "0x1676d4D39cbC7519De75878765Fdde964B432732",
        "syncing": false
      }
    }
  }
}
```

## GetTransaction

This field returns the detail of the transaction by hash.

**Query Parameters**

- hash: the transaction hash\*

**Fields**

- block_hash: hash of the block that contains the transaction
- block_height: height of the block that contains the transaction
- hash: the hash of the transaction itself
- transaction: the details of the transaction

**Example**

```graphql
{
  ThetaRpc {
    GetTransaction(hash: "0xfe298bd5a8718fe009f66d38caed35f0d91f96008d16d56f090e71de89af2124") {
      block_height
      block_hash
      hash
      status
      type
    }
  }
}
```

**Response**

```json
{
  "data": {
    "ThetaRpc": {
      "GetTransaction": {
        "block_height": "12834712",
        "block_hash": "0xbd61148982254aecb8fae8f921c9c67c7e31e0e2e65a649c76b8cd4a6bc40681",
        "hash": "0xfe298bd5a8718fe009f66d38caed35f0d91f96008d16d56f090e71de89af2124",
        "status": "finalized",
        "type": "TxCoinbase"
      }
    }
  }
}
```

## GetVcpByHeight

This field returns the information of the validator node.

**Query Parameters**

- height: the block height, optional. By default, the height of the latest finalized block will be returned.

**Fields**

- BlockHashVcpPairs
  - BlockHash
  - HeightList
  - Vcp
    - BlockHash
    - SortedCandidates

**Example**

```graphql
{
  ThetaRpc {
    GetVcpByHeight {
      BlockHashVcpPairs {
        BlockHash
        HeightList {
          Heights
        }
        Vcp {
          BlockHash
          SortedCandidates {
            Holder
          }
        }
      }
    }
  }
}
```

**Response**

```shell
{
  "data": {
    "ThetaRpc": {
      "GetVcpByHeight": {
        "BlockHashVcpPairs": [
          {
            "BlockHash": "0xe2efcbef506528d07964b08c2f7f69e5693432a42fd19774746653bdc8ba69fa",
            "HeightList": {
              "Heights": [
                0,
                ...
                ]
            },
            "Vcp": {
              "BlockHash": null,
              "SortedCandidates": [
                {
                  "Holder": "0x80eab22e27d4b94511f5906484369b868d6552d2"
                },
                ...
                ]
            }
          }
        ]
      }
    }
  }

```

## GetVersion

- version: version of the code
- git_hash: the git commit hash of the code base
- timestamp: the build timestamp
  **Example**

```graphql
{
  ThetaRpc {
    GetVersion {
      git_hash
      timestamp
      version
    }
  }
}
```

**_Response_**

```json
{
  "data": {
    "ThetaRpc": {
      "GetVersion": {
        "git_hash": "cdf84379e85bb75d8f11ce2f5a1897c5134c9669",
        "timestamp": "Wed Oct 27 06:46:55 UTC 2021",
        "version": "3.1.2"
      }
    }
  }
}
```
