## Description

Theta data analyse server and graphql api server.

## Clone
```bash
git clone https://github.com/theta-data/theta-data-api.git && cd theta-data-api
```

## Installation

```bash
$ npm install
```

## Config

```bash
# edit file in config/test.json and replace with your own prams.
{
  "THETA_DATA_DB": {
    "host": "replace with your own",
    "port": "replace with your own",
    "username": "replace with your own",
    "password": "replace with your own",
    "database": "replace with your own",
    "synchronize": true,
    "autoLoadEntities": true,
    "entities": ["src/**/*.entity{.ts,.js}"],
    "logging": false,
    "extra": {
      "charset": "utf8mb4_unicode_ci"
    }
  },
  "THETA_NODE_HOST" : "https://theta-bridge-rpc.thetatoken.org/rpc",  //replace with your own guardian node rpc interface
  "LOG_PATH": "replace with your own",
  "REDIS": {
    "host": "replace with your own",
    "port": "replace with your own"
  }
}

```

## Start the app

```bash
# graphql api development
$ npm run start

# analyse server development
$ npm run analyse

# watch mode
$ npm run start:dev


```

## PlayGround

You can then open the browser and visit http://localhost:3000 (The host (`localhost`) and the port (`3000`) are defined in the config). You should see the GraphQL playground if the installation is correct.

![avatar](https://github.com/larryro/image/blob/main/playground_20211101112605.png?raw=true)

## Test

```bash
$ npm run test
```

## Build

```bash
# build
$ npm run build

# run graphql api server
$ node dist/main

# run analyse server
$ node dist/analyse
```

## Contact

contact@thetadata.io

## License

The Theta Data Api is licensed under the [MIT License](https://opensource.org/licenses/MIT).
