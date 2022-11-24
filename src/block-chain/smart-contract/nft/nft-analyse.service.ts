import { NftRetriveEntity } from './nft-retrive.entity'
import { SmartContractEntity } from 'src/block-chain/smart-contract/smart-contract.entity'
import { NftTransferRecordEntity } from 'src/block-chain/smart-contract/nft/nft-transfer-record.entity'
import { NftBalanceEntity } from './nft-balance.entity'
import { Injectable, Logger } from '@nestjs/common'
import {
  Connection,
  getConnection,
  LessThan,
  MoreThan,
  MoreThanOrEqual,
  QueryRunner
} from 'typeorm'
import { SmartContractCallRecordEntity } from 'src/block-chain/smart-contract/smart-contract-call-record.entity'
import { NftService } from 'src/block-chain/smart-contract/nft/nft.service'
import { UtilsService, writeFailExcuteLog, writeSucessExcuteLog } from 'src/common/utils.service'
const fs = require('fs')
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
  private retriveIdFile = config.get('ORM_CONFIG')['database'] + 'nft/retrive.id'
  private imgPathRestoreId = config.get('ORM_CONFIG')['database'] + 'nft/img-path-restore.id'

  constructor(
    private nftService: NftService,
    private utilsService: UtilsService,
    @InjectConnection('smart_contract') private smartContractConnectionInjected: Connection,
    @InjectConnection('nft') private nftConnectionInjected: Connection
  ) {}

  public async analyseData(loop: number) {
    try {
      this.logger.debug(loop + ' start analyse nft data')
      // console.log(config.get('NFT'))
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
      if (config.get('RESTORE_NFT_IMG_PATH')) {
        await this.restoreNftImgPath()
      }

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
    // const pageCount = Math.ceil(100000 / pageSize)
    if ((loop * pageSize) % 100000 == 0) {
      const latestNftRecord = await this.nftConnectionRunner.manager.findOne(NftBalanceEntity, {
        // skip: loop * pageSize,
        // take: pageSize,
        where: { id: MoreThan(0) },
        order: {
          id: 'DESC'
        }
      })
      if (!latestNftRecord) fs.writeFileSync(this.retriveIdFile, '0')
      else fs.writeFileSync(this.retriveIdFile, latestNftRecord.id.toString())
    }

    const startId = Number(fs.readFileSync(this.retriveIdFile, 'utf8'))

    const list = await this.nftConnectionRunner.manager.find(NftBalanceEntity, {
      // skip: loop * pageSize,
      where: { id: LessThan(startId) },
      take: pageSize,
      order: {
        id: 'DESC'
      }
    })
    for (const item of list) {
      this.logger.debug('start download ' + item.id + ' ' + item.name)
      // let img = item.img_uri
      // if (!item.detail) {
      if (item.refetch_times >= 3) continue
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
        item.refetch_times = item.refetch_times + 1
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
    if (list.length > 0) fs.writeFileSync(this.retriveIdFile, list[list.length - 1].id.toString())
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

  async restoreNftImgPath() {
    const startId = this.utilsService.getRecordHeight(this.imgPathRestoreId)
    const nftList = await this.nftConnectionRunner.manager.find(NftBalanceEntity, {
      where: {
        id: MoreThanOrEqual(startId)
      },
      take: 5000,
      order: {
        id: 'ASC'
      }
    })
    this.logger.debug('nft img to restore:' + nftList.length)
    if (nftList.length == 0) return
    for (const nft of nftList) {
      if (nft.detail) {
        const nftDetail = JSON.parse(nft.detail)
        nft.img_uri = nftDetail.image
        await this.nftConnectionRunner.manager.save(nft)
        await this.nftConnectionRunner.manager.update(
          NftTransferRecordEntity,
          {
            smart_contract_address: nft.smart_contract_address,
            token_id: nft.token_id
          },
          { img_uri: nft.img_uri }
        )
      }
    }
    this.utilsService.updateRecordHeight(this.imgPathRestoreId, nftList[nftList.length - 1].id)
  }
}
