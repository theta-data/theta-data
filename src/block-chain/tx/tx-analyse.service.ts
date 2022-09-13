import { Injectable, Logger, SerializeOptions } from '@nestjs/common'
import { Connection, getConnection, getConnectionManager, QueryRunner } from 'typeorm'
import { THETA_TRANSACTION_TYPE_ENUM } from 'theta-ts-sdk/dist/types/enum'
import { thetaTsSdk } from 'theta-ts-sdk'
import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/src/types/interface'
import BigNumber from 'bignumber.js'
import { SmartContractEntity } from 'src/block-chain/smart-contract/smart-contract.entity'
import { UtilsService, writeFailExcuteLog, writeSucessExcuteLog } from 'src/common/utils.service'
import { config } from 'src/const'
import { getConnectionName, InjectConnection } from '@nestjs/typeorm'
import { createConnection } from 'net'
// const config = require('config')
const moment = require('moment')

@Injectable()
export class TxAnalyseService {
  private readonly logger = new Logger('tx analyse service')
  analyseKey = 'under_analyse'
  private counter = 0

  private txConnection: QueryRunner
  private heightConfigFile = config.get('ORM_CONFIG')['database'] + 'tx/record.height'
  constructor(
    private utilsService: UtilsService,
    @InjectConnection('tx')
    private readonly connection: Connection
  ) {
    thetaTsSdk.blockchain.setUrl(config.get('THETA_NODE_HOST'))
    // this.logger.debug(config.get('THETA_NODE_HOST'))
  }

  public async analyseData() {
    try {
      // this.logger.debug(getConnectionName())
      // await createConnection({
      //   ...config.get('ORM_CONFIG'),
      //   database: config.get('ORM_CONFIG')['database'] + 'tx/index.sqlite',
      //   name: 'tx',
      //   entities: []
      // })
      // console.log(this.connection)
      // this.txConnection = getConnectionManager().get('tx').createQueryRunner()
      this.txConnection = this.connection.createQueryRunner()
      await this.txConnection.connect()
      await this.txConnection.startTransaction()

      let height: number = 0
      const lastfinalizedHeight = Number(
        (await thetaTsSdk.blockchain.getStatus()).result.latest_finalized_block_height
      )
      height = lastfinalizedHeight - 1000

      if (config.get('TX.START_HEIGHT')) {
        height = config.get('TX.START_HEIGHT')
      }
      const recordHeight = this.utilsService.getRecordHeight(this.heightConfigFile)
      height = recordHeight > height ? recordHeight : height
      if (height >= lastfinalizedHeight) {
        await this.txConnection.commitTransaction()
        this.logger.debug('commit success')
        this.logger.debug('no height to analyse')
        return
      }
      // await this.
      let endHeight = lastfinalizedHeight
      const analyseNumber = config.get('TX.ANALYSE_NUMBER')
      if (lastfinalizedHeight - height > analyseNumber) {
        endHeight = height + analyseNumber
      }
      this.logger.debug('start height: ' + height + '; end height: ' + endHeight)
      //   this.startTimestamp = moment().unix()
      const blockList = await thetaTsSdk.blockchain.getBlockSByRange(
        height.toString(),
        endHeight.toString()
      )
      this.logger.debug('block list length:' + blockList.result.length)
      this.counter = blockList.result.length
      this.logger.debug('init counter', this.counter)
      for (let i = 0; i < blockList.result.length; i++) {
        const block = blockList.result[i]
        this.logger.debug(block.height + ' start hanldle')
        await this.handleOrderCreatedEvent(block, lastfinalizedHeight)
      }
      this.logger.debug('start update calltimes by period')
      await this.txConnection.commitTransaction()
      this.logger.debug('commit success')
      if (blockList.result.length > 1) {
        this.utilsService.updateRecordHeight(
          this.heightConfigFile,
          Number(blockList.result[blockList.result.length - 1].height)
        )
      }
    } catch (e) {
      // console.log(e)
      console.error(e.message)
      this.logger.error(e.message)
      this.logger.error('rollback')
      await this.txConnection.rollbackTransaction()
      writeFailExcuteLog(config.get('TX.MONITOR_PATH'))
      // process.exit(0)
    } finally {
      await this.txConnection.release()
      this.logger.debug('release success')
      writeSucessExcuteLog(config.get('TX.MONITOR_PATH'))
    }
  }

  // @OnEvent('block.analyse')
  async handleOrderCreatedEvent(block: THETA_BLOCK_INTERFACE, latestFinalizedBlockHeight: number) {
    this.logger.debug(block.height + ' start insert')

    const height = Number(block.height)
    const timestamp = moment(
      moment(Number(block.timestamp) * 1000).format('YYYY-MM-DD HH:00:00')
    ).unix()

    let coin_base_transaction = 0,
      theta_fuel_burnt_by_smart_contract = 0,
      theta_fuel_burnt_by_transfers = 0,
      deposit_stake_transaction = 0,
      release_fund_transaction = 0,
      reserve_fund_transaction = 0,
      send_transaction = 0,
      service_payment_transaction = 0,
      slash_transaction = 0,
      smart_contract_transaction = 0,
      split_rule_transaction = 0,
      withdraw_stake_transaction = 0,
      block_number = 0,
      active_wallet = 0,
      theta_fuel_burnt = 0
    // }
    const wallets = {}
    const smartContractToDeal: { [index: string]: SmartContractEntity } = {}
    for (const transaction of block.transactions) {
      switch (transaction.type) {
        case THETA_TRANSACTION_TYPE_ENUM.coinbase:
          coin_base_transaction++
          break
        case THETA_TRANSACTION_TYPE_ENUM.deposit_stake:
          deposit_stake_transaction++
          break
        case THETA_TRANSACTION_TYPE_ENUM.tx_deposit_stake_v2:
          deposit_stake_transaction++
          break
        case THETA_TRANSACTION_TYPE_ENUM.release_fund:
          release_fund_transaction++
          break
        case THETA_TRANSACTION_TYPE_ENUM.reserve_fund:
          reserve_fund_transaction++
          break
        case THETA_TRANSACTION_TYPE_ENUM.send:
          send_transaction++
          if (transaction.raw.fee && transaction.raw.fee.tfuelwei != '0') {
            theta_fuel_burnt_by_transfers += new BigNumber(transaction.raw.fee.tfuelwei)
              .dividedBy('1e18')
              .toNumber()
          }
          break

        case THETA_TRANSACTION_TYPE_ENUM.service_payment:
          service_payment_transaction++
          break
        case THETA_TRANSACTION_TYPE_ENUM.slash:
          slash_transaction++
          break
        case THETA_TRANSACTION_TYPE_ENUM.smart_contract:
          smart_contract_transaction++
          this.logger.debug('start parse nft record')
          if (transaction.raw.gas_limit && transaction.raw.gas_price) {
            theta_fuel_burnt_by_smart_contract += new BigNumber(transaction.raw.gas_price)
              .multipliedBy(transaction.receipt.GasUsed)
              .dividedBy('1e18')
              .toNumber()

            theta_fuel_burnt += new BigNumber(transaction.raw.gas_price)
              .multipliedBy(transaction.receipt.GasUsed)
              .dividedBy('1e18')
              .toNumber()
          }
          break
        case THETA_TRANSACTION_TYPE_ENUM.split_rule:
          split_rule_transaction++
          break
        case THETA_TRANSACTION_TYPE_ENUM.withdraw_stake:
          withdraw_stake_transaction++
          break
        default:
          this.logger.error('no transaction.tx_type:' + transaction.type)
          break
      }

      if (transaction.raw.fee && transaction.raw.fee.tfuelwei != '0') {
        theta_fuel_burnt += new BigNumber(transaction.raw.fee.tfuelwei).dividedBy('1e18').toNumber()
      }
    }
    this.logger.debug(height + ' end upsert wallets')
    block_number++
    await this.txConnection.query(
      `INSERT INTO theta_tx_num_by_hours_entity (block_number,theta_fuel_burnt,theta_fuel_burnt_by_smart_contract,theta_fuel_burnt_by_transfers,active_wallet,coin_base_transaction,slash_transaction,send_transaction,reserve_fund_transaction,release_fund_transaction,service_payment_transaction,split_rule_transaction,deposit_stake_transaction,withdraw_stake_transaction,smart_contract_transaction,latest_block_height,timestamp) VALUES (${block_number},${theta_fuel_burnt}, ${theta_fuel_burnt_by_smart_contract},${theta_fuel_burnt_by_transfers},0,${coin_base_transaction},${slash_transaction},${send_transaction},${reserve_fund_transaction},${release_fund_transaction},${service_payment_transaction},${split_rule_transaction},${deposit_stake_transaction},${withdraw_stake_transaction},${smart_contract_transaction},${height},${timestamp})  ON CONFLICT (timestamp) DO UPDATE set block_number=block_number+${block_number},  theta_fuel_burnt=theta_fuel_burnt+${theta_fuel_burnt},theta_fuel_burnt_by_smart_contract=theta_fuel_burnt_by_smart_contract+${theta_fuel_burnt_by_smart_contract},theta_fuel_burnt_by_transfers=theta_fuel_burnt_by_transfers+${theta_fuel_burnt_by_transfers},coin_base_transaction=coin_base_transaction+${coin_base_transaction},slash_transaction=slash_transaction+${slash_transaction},send_transaction=send_transaction+${send_transaction},reserve_fund_transaction=reserve_fund_transaction+${reserve_fund_transaction},release_fund_transaction=release_fund_transaction+${release_fund_transaction},service_payment_transaction=service_payment_transaction+${service_payment_transaction},split_rule_transaction=split_rule_transaction+${split_rule_transaction},deposit_stake_transaction=deposit_stake_transaction+${deposit_stake_transaction},withdraw_stake_transaction=withdraw_stake_transaction+${withdraw_stake_transaction},smart_contract_transaction=smart_contract_transaction+${smart_contract_transaction},latest_block_height=${height};`
    )

    this.logger.debug(height + ' end update theta tx num by hours')

    this.logger.debug(height + ' end update analyse')
    this.counter--
  }
}
