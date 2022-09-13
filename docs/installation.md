# Setup and Installation

## Data Endpoint

https://thetadata.io/graphql/

## Install
```bash
npm add graphql-request graphql
```

## Quickstart

Send a GraphQL query with a single line of code.

```javascript
import { request, gql } from 'graphql-request'

const query = gql`
  {
    MarketInformation {
      Theta {
        name
        market_cap
        total_supply
        volume_24h
      }
    }
  }
`

request('https://thetadata.io/graphql/', query).then((data) => console.log(data))
```

## Graphql Introduction

More information about Graphql, check [https://graphql.org/](https://graphql.org/)
