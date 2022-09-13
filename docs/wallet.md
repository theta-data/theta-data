# Wallet

## Balance

The balance information of wallets

**Query Parameters**

- wallet_address: address of the wallet to check

**Fields**

- stake_to_elite_node: number and value of theta fuel tokens pledged to the elite edge node
- stake_to_guardian: number and value of theta tokens pledged to the guardian node
- stake_to_validator_node: the number and value of tokens pledged to the validator node
- theta: Theta balance in your wallet
- theta_fuel: Theta fuel balance in your wallet
- total: the total token value of the wallet

**Example**

```graphql
{
  Wallet {
    Balance(wallet_address: "0xdc5a5c776b1ee57f16454094f0405ef7d7bdeb76") {
      stake_to_elite_node {
        amount
        fiat_currency_value {
          cny
          eur
          usd
        }
        node_address
        return_height
        withdrawn
      }
      stake_to_guardian {
        amount
        fiat_currency_value {
          cny
          eur
          usd
        }
        node_address
        return_height
        withdrawn
      }
      stake_to_validator_node {
        amount
        fiat_currency_value {
          cny
          eur
          usd
        }
        node_address
        return_height
        withdrawn
      }
      theta {
        amount
        fiat_currency_value {
          cny
          eur
          usd
        }
      }
      theta_fuel {
        amount
        fiat_currency_value {
          cny
          eur
          usd
        }
      }
      total {
        fiat_currency_value {
          cny
          eur
          usd
        }
        theta_amount
        theta_fuel_amount
      }
    }
  }
}
```

**Response**

```json
{
  "data": {
    "Wallet": {
      "Balance": {
        "stake_to_elite_node": [
          {
            "amount": 234464.7168383758,
            "fiat_currency_value": {
              "cny": 496579.3869211467,
              "eur": 66987.70446416721,
              "usd": 77711.95413476475
            },
            "node_address": "0x0972a888a7d481ade1450d77852de59fd5831ac4",
            "return_height": "18446744073709551615",
            "withdrawn": false
          }
        ],
        "stake_to_guardian": [
          {
            "amount": 1459.30726549,
            "fiat_currency_value": {
              "cny": 65875.04016445606,
              "eur": 8886.429518272476,
              "usd": 10309.0829678335
            },
            "node_address": "0x88884a84d980bbfb7588888126fb903486bb8888",
            "return_height": "18446744073709551615",
            "withdrawn": false
          }
        ],
        "stake_to_validator_node": [],
        "theta": {
          "amount": 21.00541587,
          "fiat_currency_value": {
            "cny": 948.2119679865563,
            "eur": 127.91216219161369,
            "usd": 148.38997934061913
          }
        },
        "theta_fuel": {
          "amount": 3285.5575835328314,
          "fiat_currency_value": {
            "cny": 6958.574375391124,
            "eur": 938.6997044737323,
            "usd": 1088.9787754915687
          }
        },
        "total": {
          "fiat_currency_value": {
            "cny": 570361.2134289804,
            "eur": 76940.74584910503,
            "usd": 89258.40585743044
          },
          "theta_amount": 1480.31268136,
          "theta_fuel_amount": 237750.27442190863
        }
      }
    }
  }
}
```
