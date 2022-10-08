import { NftRetriveEntity } from './nft-retrive.entity'
import { SmartContractEntity } from 'src/block-chain/smart-contract/smart-contract.entity'
import { NftTransferRecordEntity } from 'src/block-chain/smart-contract/nft/nft-transfer-record.entity'
import { NftBalanceEntity } from './nft-balance.entity'
import { Injectable, Logger } from '@nestjs/common'
import { Connection, getConnection, LessThan, MoreThan, QueryRunner } from 'typeorm'
import { SmartContractCallRecordEntity } from 'src/block-chain/smart-contract/smart-contract-call-record.entity'
import { NftService } from 'src/block-chain/smart-contract/nft/nft.service'
import { UtilsService, writeFailExcuteLog, writeSucessExcuteLog } from 'src/common/utils.service'
const fs = require('fs')
import fetch from 'cross-fetch'
import { config } from 'src/const'
import { InjectConnection } from '@nestjs/typeorm'
import { isEmpty } from 'rxjs'
const axios = require('axios')
@Injectable()
export class NftAnalyseService {
  private readonly logger = new Logger('nft analyse service')
  analyseKey = 'under_analyse'

  private smartContractConnectionRunner: QueryRunner
  private nftConnectionRunner: QueryRunner
  private heightConfigFile = config.get('ORM_CONFIG')['database'] + 'nft/record.height'

  constructor(
    private nftService: NftService,
    private utilsService: UtilsService,
    @InjectConnection('smart_contract') private smartContractConnectionInjected: Connection,
    @InjectConnection('nft') private nftConnectionInjected: Connection
  ) {}

  public async analyseData(loop: number) {
    try {
      this.logger.debug(loop + ' start analyse nft data')
      console.log(config.get('NFT'))
      // this.logger.debug(logoConfig)
      this.smartContractConnectionRunner = this.smartContractConnectionInjected.createQueryRunner()
      this.nftConnectionRunner = this.nftConnectionInjected.createQueryRunner()

      await this.nftConnectionRunner.startTransaction()
      let startId: number = 0
      if (!fs.existsSync(this.heightConfigFile)) {
        fs.writeFileSync(this.heightConfigFile, '0')
      } else {
        const data = fs.readFileSync(this.heightConfigFile, 'utf8')
        if (data) {
          startId = Number(data)
        }
      }

      const contractRecordList = await this.smartContractConnectionRunner.manager.find(
        SmartContractCallRecordEntity,
        {
          where: {
            id: MoreThan(startId)
          },
          take: config.get('NFT.ANALYSE_NUMBER'),
          order: { id: 'ASC' }
        }
      )

      const promiseArr = []
      this.logger.debug('records length:' + contractRecordList.length)
      for (const record of contractRecordList) {
        // promiseArr.push(
        await this.nftService.updateNftRecord(
          this.nftConnectionRunner,
          this.smartContractConnectionRunner,
          record
        )
        // )
        // await Promise.all(promiseArr)
      }
      await this.retriveNfts()
      await this.autoRefetchTokenUri(loop)

      this.logger.debug('start update calltimes by period')
      // if (config.get('NFT.DL_ALL_NFT_IMG') == true) {
      //   await this.downloadAllImg(loop)
      // }

      await this.nftConnectionRunner.commitTransaction()
      if (contractRecordList.length > 0) {
        this.logger.debug(
          'end height:' + Number(contractRecordList[contractRecordList.length - 1].height)
        )
        this.utilsService.updateRecordHeight(
          this.heightConfigFile,
          contractRecordList[contractRecordList.length - 1].id
        )
      }
      this.logger.debug('commit success')
    } catch (e) {
      console.error(e.message)
      this.logger.error(e.message)
      this.logger.error('rollback')
      await this.nftConnectionRunner.rollbackTransaction()
      writeFailExcuteLog(config.get('NFT.MONITOR_PATH'))
    } finally {
      await this.nftConnectionRunner.release()
      writeSucessExcuteLog(config.get('NFT.MONITOR_PATH'))
      this.logger.debug('end analyse nft data')
      this.logger.debug('release success')
    }
  }

  async autoRefetchTokenUri(loop: number) {
    // const total = await this.nftConnectionRunner.manager.count(NftBalanceEntity)
    const pageSize = 100
    const pageCount = Math.ceil(100000 / pageSize)
    // if (loop > pageCount) {
    loop = loop % pageCount
    this.logger.debug('loop ' + loop + ' page count:' + pageCount)
    // return
    // }
    // for (let i = 0; i < pageCount; i++) {
    const list = await this.nftConnectionRunner.manager.find(NftBalanceEntity, {
      skip: loop * pageSize,
      take: pageSize,
      order: {
        id: 'DESC'
      }
    })
    for (const item of list) {
      this.logger.debug('start download ' + item.id + ' ' + item.img_uri)
      // let img = item.img_uri
      // if (!item.detail) {
      try {
        const httpRes = await axios({
          url: item.token_uri,
          method: 'get',
          // signal: controller.signal,
          timeout: 3000,
          responseType: 'json'
        })
        if (httpRes.status >= 400) {
          throw new Error('Bad response from server')
        }
        const res: any = httpRes.data
        if (JSON.stringify(res) == item.detail) continue
        item.detail = JSON.stringify(res)
        item.name = res.name
        if (
          (await this.utilsService.getPath(res.image, config.get('NFT.STATIC_PATH'))) !=
          item.img_uri
        ) {
          item.img_uri = await this.utilsService.downloadImage(
            res.image,
            config.get('NFT.STATIC_PATH')
          )
        }
        this.logger.debug('end get token uri ' + item.img_uri)
        // console.log(res)
      } catch (e) {
        this.logger.error(e)
      }
      await this.nftConnectionRunner.manager.save(item)
      await this.nftConnectionRunner.manager.update(
        NftTransferRecordEntity,
        {
          smart_contract_address: item.smart_contract_address,
          token_id: item.token_id
        },
        { img_uri: item.img_uri, name: item.name }
      )
    }
    // }
    // const nfts = await this.nftConnection.manager.find(NftBalanceEntity)
  }

  async retriveNfts() {
    const moment = require('moment')
    const smartContracts = await this.smartContractConnectionRunner.manager.find(
      SmartContractEntity,
      {
        where: {
          verification_date: MoreThan(moment().subtract(1, 'days').unix())
        }
      }
    )
    for (const contract of smartContracts) {
      const retrived = await this.nftConnectionRunner.manager.findOne(NftRetriveEntity, {
        where: {
          smart_contract_address: contract.contract_address
        }
      })
      if (retrived) {
        continue
      }

      const nftRecords = await this.smartContractConnectionRunner.manager.find(
        SmartContractCallRecordEntity,
        {
          where: {
            contract_id: contract.id,
            timestamp: LessThan(contract.verification_date + 10 * 60)
          }
        }
      )
      for (const record of nftRecords) {
        await this.nftService.updateNftRecord(
          this.nftConnectionRunner,
          this.smartContractConnectionRunner,
          record
        )
      }
      const retrive = new NftRetriveEntity()
      retrive.smart_contract_address = contract.contract_address
      retrive.retrived = true
      await this.nftConnectionRunner.manager.save(retrive)
    }
  }
}
