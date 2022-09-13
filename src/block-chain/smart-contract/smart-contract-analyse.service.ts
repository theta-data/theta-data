import { Injectable, Logger } from '@nestjs/common'
import { getConnection, LessThan, MoreThan, QueryRunner } from 'typeorm'
import { THETA_TRANSACTION_TYPE_ENUM } from 'theta-ts-sdk/dist/types/enum'
import { thetaTsSdk } from 'theta-ts-sdk'
import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/src/types/interface'
import { LoggerService } from 'src/common/logger.service'
import { SmartContractCallRecordEntity } from 'src/block-chain/smart-contract/smart-contract-call-record.entity'
import { SmartContractEntity } from 'src/block-chain/smart-contract/smart-contract.entity'
import { UtilsService, writeFailExcuteLog, writeSucessExcuteLog } from 'src/common/utils.service'
import { SmartContractService } from 'src/block-chain/smart-contract/smart-contract.service'
import fetch from 'cross-fetch'
import { config } from 'src/const'
const moment = require('moment')
const fs = require('fs')
@Injectable()
export class SmartContractAnalyseService {
  private readonly logger = new Logger('smart contract analyse service')
  analyseKey = 'under_analyse'
  private counter = 0
  private startTimestamp = 0
  private smartContractConnection: QueryRunner
  private heightConfigFile = config.get('ORM_CONFIG')['database'] + 'smart_contract/record.height'
  private smartContractList: Array<string> = []
  constructor(
    private loggerService: LoggerService,
    private utilsService: UtilsService,
    private smartContractService: SmartContractService
  ) {
    // thetaTsSdk.blockchain.setUrl(config.get('SMART_CONTRACT.THETA_NODE_HOST'))
    this.logger.debug(config.get('SMART_CONTRACT.THETA_NODE_HOST'))
  }

  public async analyseData() {
    try {
      this.smartContractConnection = getConnection('smart_contract').createQueryRunner()
      await this.smartContractConnection.connect()
      await this.smartContractConnection.startTransaction()
      let height: number = 0
      const lastfinalizedHeight = Number(
        (await thetaTsSdk.blockchain.getStatus()).result.latest_finalized_block_height
      )
      height = lastfinalizedHeight - 1000

      if (config.get('SMART_CONTRACT.START_HEIGHT')) {
        height = config.get('SMART_CONTRACT.START_HEIGHT')
      }
      // console.log(path.resolve(this.heightConfigFile))
      if (!fs.existsSync(this.heightConfigFile)) {
        this.logger.debug('read height')
        // mkdirSync(this.heightConfigFile)
        this.logger.debug('finish mkdir')
        fs.writeFileSync(this.heightConfigFile, '0')
      } else {
        const data = fs.readFileSync(this.heightConfigFile, 'utf8')
        if (data && Number(data) > height) {
          height = Number(data) + 1
        }
      }

      const latestRecord = await this.smartContractConnection.manager.findOne(
        SmartContractCallRecordEntity,
        {
          order: {
            height: 'DESC'
          }
        }
      )
      const latestRecordHeight = latestRecord ? latestRecord.height : 0

      if (latestRecordHeight >= height) {
        height = latestRecordHeight + 1
      }

      if (height >= lastfinalizedHeight) {
        await this.smartContractConnection.commitTransaction()
        this.logger.debug('commit success')
        this.logger.debug('no height to analyse')
        return
      }
      let endHeight = lastfinalizedHeight
      const analyseNumber = config.get('SMART_CONTRACT.ANALYSE_NUMBER')
      if (lastfinalizedHeight - height > analyseNumber) {
        endHeight = height + analyseNumber
      }
      this.logger.debug('start height: ' + height + '; end height: ' + endHeight)
      this.startTimestamp = moment().unix()
      const blockList = await thetaTsSdk.blockchain.getBlockSByRange(
        height.toString(),
        endHeight.toString()
      )
      this.logger.debug('block list length:' + blockList.result.length)
      this.counter = blockList.result.length
      this.logger.debug('init counter', this.counter)
      this.smartContractList = []
      for (let i = 0; i < blockList.result.length; i++) {
        const block = blockList.result[i]
        this.logger.debug(block.height + ' start hanldle')
        await this.handleOrderCreatedEvent(block, lastfinalizedHeight)
      }

      await this.clearCallTimeByPeriod()
      for (const contract of this.smartContractList) {
        await this.updateCallTimesByPeriod(contract)
      }
      await this.smartContractConnection.commitTransaction()
      if (blockList.result.length > 1) {
        this.utilsService.updateRecordHeight(
          this.heightConfigFile,
          Number(blockList.result[blockList.result.length - 1].height)
        )
      }
    } catch (e) {
      console.error(e.message)
      this.logger.error(e.message)
      this.logger.error('rollback')
      await this.smartContractConnection.rollbackTransaction()
      writeFailExcuteLog(config.get('SMART_CONTRACT.MONITOR_PATH'))
    } finally {
      await this.smartContractConnection.release()
      this.logger.debug('release success')
      writeSucessExcuteLog(config.get('SMART_CONTRACT.MONITOR_PATH'))
    }
    // await this.
  }

  async handleOrderCreatedEvent(block: THETA_BLOCK_INTERFACE, latestFinalizedBlockHeight: number) {
    this.logger.debug(block.height + ' start insert')
    const height = Number(block.height)
    for (const transaction of block.transactions) {
      switch (transaction.type) {
        case THETA_TRANSACTION_TYPE_ENUM.smart_contract:
          await this.smartContractConnection.query(
            `INSERT INTO smart_contract_entity(contract_address,height,call_times_update_timestamp) VALUES ('${
              transaction.receipt.ContractAddress
            }',${height},${moment().unix()})  ON CONFLICT (contract_address) DO UPDATE set call_times=call_times+1,call_times_update_timestamp=${moment().unix()};`
          )
          if (this.smartContractList.indexOf(transaction.receipt.ContractAddress) == -1) {
            this.smartContractList.push(transaction.receipt.ContractAddress)
          }
          const smartContract = await this.smartContractConnection.manager.findOne(
            SmartContractEntity,
            {
              contract_address: transaction.receipt.ContractAddress
            }
          )
          if (
            smartContract.call_times > config.get('SMART_CONTRACT_VERIFY_DETECT_TIMES') &&
            !smartContract.verified &&
            moment().unix() - smartContract.verification_check_timestamp > 3600 * 24 * 30
          ) {
            const checkInfo = await this.verifyWithThetaExplorer(smartContract.contract_address)
            if (checkInfo) {
              Object.assign(smartContract, checkInfo)
              smartContract.verification_check_timestamp = moment().unix()
            } else {
              smartContract.verification_check_timestamp = moment().unix()
            }

            await this.smartContractConnection.manager.save(SmartContractEntity, smartContract)
          }
          if (config.get('CONFLICT_TRANSACTIONS').indexOf(transaction.hash) !== -1) break
          await this.smartContractConnection.manager.insert(
            SmartContractCallRecordEntity,
            {
              timestamp: Number(block.timestamp),
              data: transaction.raw.data,
              receipt: JSON.stringify(transaction.receipt),
              height: height,
              transaction_hash: transaction.hash,
              contract_id: smartContract.id
            }
            // ['transaction_hash']
          )
          break
      }
    }
    this.logger.debug(height + ' end update analyse')
    this.counter--
    this.loggerService.timeMonitor('counter:' + this.counter, this.startTimestamp)
  }

  async verifyWithThetaExplorer(address: string) {
    this.logger.debug('start verify: ' + address)
    const httpRes = await fetch(
      'https://explorer.thetatoken.org:8443/api/smartcontract/' + address,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    if (httpRes.status >= 400) {
      this.logger.error('Get smart contract ' + address + ': Bad response from server')
      return false
      // throw new Error('Get smart contract Info: Bad response from server')
    }
    const res: any = await httpRes.json()
    if (res.body.verification_date == '') return false
    // console.log('theta explorer res optimizer ', res.body.optimizer)
    const optimizer = res.body.optimizer === 'disabled' ? false : true
    // console.log('optimizer', optimizer)
    const optimizerRuns = res.body.optimizerRuns ? res.body.optimizerRuns : 200
    const sourceCode = res.body.source_code
    const version = res.body.compiler_version.match(/[\d,\.]+/g)[0]
    const versionFullName = 'soljson-' + res.body.compiler_version + '.js'
    const byteCode = res.body.bytecode

    address = this.utilsService.normalize(address.toLowerCase())
    return this.smartContractService.getVerifyInfo(
      address,
      sourceCode,
      byteCode,
      version,
      versionFullName,
      optimizer,
      optimizerRuns
    )
  }

  async updateCallTimesByPeriod(contractAddress: string) {
    this.logger.debug('start update call times by period')
    // if (config.get('IGNORE')) return false
    const contract = await this.smartContractConnection.manager.findOne(SmartContractEntity, {
      contract_address: contractAddress
    })

    contract.last_24h_call_times = await this.smartContractConnection.manager.count(
      SmartContractCallRecordEntity,
      {
        timestamp: MoreThan(moment().subtract(24, 'hours').unix()),
        contract_id: contract.id
      }
    )
    contract.last_seven_days_call_times = await this.smartContractConnection.manager.count(
      SmartContractCallRecordEntity,
      {
        timestamp: MoreThan(moment().subtract(7, 'days').unix()),
        contract_id: contract.id
      }
    )
    await this.smartContractConnection.manager.save(contract)
    this.logger.debug('end update call times by period')
  }

  async clearCallTimeByPeriod() {
    // if (config.get('IGNORE')) return false
    await this.smartContractConnection.manager.update(
      SmartContractEntity,
      {
        call_times_update_timestamp: LessThan(moment().subtract(24, 'hours').unix())
      },
      { last_24h_call_times: 0 }
    )
    await this.smartContractConnection.manager.update(
      SmartContractEntity,
      {
        call_times_update_timestamp: LessThan(moment().subtract(7, 'days').unix())
      },
      { last_seven_days_call_times: 0 }
    )
  }
}
