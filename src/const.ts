export const DEFAULT_CONFIG = {
  ORM_CONFIG: {
    database: '../database/',
    synchronize: true,
    autoLoadEntities: true,
    name: 'THETA_DATA',
    type: 'better-sqlite3',
    entities: ['src/**/*.entity{.ts,.js}'],
    bigNumberStrings: false,
    logging: false,
    extra: {
      charset: 'utf8mb4_unicode_ci'
    }
  },
  START_HEIGHT: 14590900,
  THETA_NODE_HOST: 'https://theta-bridge-rpc.thetatoken.org/rpc',
  LOG_PATH: '/home/ubuntu/theta-data/logs/',
  ANALYSE_INTERVAL: 1000,
  ANALYSE_NUMBER: 100,
  IGNORE: false,
  RATE_LIMIT: {
    ttl: 60,
    limit: 10
  },
  SMART_CONTRACT_VERIFY_DETECT_TIMES: 0,
  RE_SYNC_BALANCE: false,
  STAKE_ANALYSE_START_HEIGHT: 16403700,
  CONFLICT_TRANSACTIONS: [
    '0x4a9c74bf71ac6a3591672d67e975887ef8374ba34b45342305e656666d9cdcf1',
    '0x82236267393c31c17bf4e79fb14f9fc0396c05821ebd357e6b420a43933d64db'
  ],
  NFT: {
    ANALYSE_NUMBER: 100,
    ANALYSE_INTERVAL: 1000,
    DL_ALL_NFT_IMG: false,
    STATIC_PATH: '../static/'
  },
  SMART_CONTRACT: {
    ANALYSE_NUMBER: 100,
    ANALYSE_INTERVAL: 1000,
    THETA_NODE_HOST: 'https://theta-bridge-rpc.thetatoken.org/rpc',
    START_HEIGHT: 14590900
  },
  NFT_STATISTICS: {
    ANALYSE_NUMBER: 100,
    ANALYSE_INTERVAL: 1000,
    STATIC_PATH: '../static/'
  },
  EXPLORER: {
    ANALYSE_NUMBER: 100,
    ANALYSE_INTERVAL: 1000,
    START_HEIGHT: 8000000
  },
  STAKE: {
    ANALYSE_NUMBER: 100,
    ANALYSE_INTERVAL: 1000,
    START_HEIGHT: 16515100
  },
  TX: {
    ANALYSE_NUMBER: 100,
    ANALYSE_INTERVAL: 1000,
    START_HEIGHT: 8000000
  },
  WALLET: {
    START_HEIGHT: 8000000,
    ANALYSE_NUMBER: 100,
    ANALYSE_INTERVAL: 1000
  }
}
const fs = require('fs')
const _ = require('lodash')
export const config = (function () {
  let config = DEFAULT_CONFIG
  const configFile = '.theta-data.' + process.env.NODE_ENV + '.json'
  const defaultConfigFile = '.theta-data.json'
  if (fs.existsSync(configFile)) {
    config = _.merge(config, JSON.parse(fs.readFileSync(configFile, 'utf8')))
  } else if (fs.existsSync(defaultConfigFile)) {
    config = _.merge(config, JSON.parse(fs.readFileSync(defaultConfigFile, 'utf8')))
  }
  return {
    get: (str: string) => {
      return _.get(config, str)
    }
  }
})()
