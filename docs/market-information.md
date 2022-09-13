# Market Information

Data related to market information from [https://coinmarketcap.com/](https://coinmarketcap.com/)
## Theta

**Fields**
- circulating_supply : circulation of theta
- last_updated: last update time
- market_cap: Theta's market value
- name: token name, always return THETA
- price: Theta token price
- total_supply: total supply of theta
- volume_24h: the trading volume of theta in the last 24 hours

## ThetaFuel

**Fields**
- circulating_supply: circulation of theta fuel
- last_updated: last update time
- market_cap: market cap of Theta Fuel
- name: token name, always return Theta Fuel
- price: price of Theta Fuel
- total_supply: total supply of Theta Fuel
- volume_24h: the trading volume of Theta Fuel in the last 24 hours

**Example**
```graphql
{
  MarketInformation {
    Theta {
      circulating_supply
      last_updated
      market_cap
      name
      price
      total_supply
      volume_24h
    }
    ThetaFuel {
      circulating_supply
      last_updated
      name
      market_cap
      price
      total_supply
      volume_24h
    }
  }
}
```
**Response**

```json
{
  "data": {
    "MarketInformation": {
      "theta": {
        "circulating_supply": 1000000000,
        "last_updated": "2021-11-12T08:28:05.000Z",
        "market_cap": 7127853656.200094,
        "name": "THETA",
        "price": 7.127853656200094,
        "total_supply": 1000000000,
        "volume_24h": 266384185.84655797
      },
      "theta_fuel": {
        "circulating_supply": 5301214400,
        "last_updated": "2021-11-12T08:27:21.000Z",
        "name": "Theta Fuel",
        "market_cap": 1790191655.795407,
        "price": 0.3376946338551044,
        "total_supply": 5301214400,
        "volume_24h": 63943763.81150441
      }
    }
  }
}
```
