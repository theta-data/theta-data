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

  async downloadAllImg(loop: number) {
    const total = await this.nftConnectionRunner.manager.count(NftBalanceEntity)
    const pageSize = 100
    const pageCount = Math.ceil(total / pageSize)
    if (loop > pageCount) {
      this.logger.debug('loop ' + loop + ' page count:' + pageCount)
      return
    }
    // for (let i = 0; i < pageCount; i++) {
    const list = await this.nftConnectionRunner.manager.find(NftBalanceEntity, {
      skip: (loop + 2400) * pageSize,
      take: pageSize,
      order: {
        id: 'DESC'
      }
    })
    for (const item of list) {
      this.logger.debug('start download ' + item.img_uri)
      // let img = item.img_uri
      if (!item.detail) {
        try {
          const res = await Promise.race([
            async () => {
              // const controller = new AbortController()
              // const timeoutId = setTimeout(() => controller.abort(), 3000)
              const httpRes = await fetch(item.token_uri, {
                method: 'GET',
                // signal: controller.signal,
                headers: {
                  'Content-Type': 'application/json'
                }
              })
              if (httpRes.status >= 400) {
                throw new Error('Bad response from server')
              }
              const res: any = await httpRes.json()
              item.detail = JSON.stringify(res)
              item.name = res.name
              item.img_uri = res.image
              this.logger.debug('end get token uri ' + item.img_uri)
            },
            this.utilsService.timeout(5000)
          ])
          console.log(res)
        } catch (e) {
          this.logger.error(e)
        }
      } else {
        const detail = JSON.parse(item.detail)

        const imgStorePath = await this.utilsService.getPath(
          detail.image,
          config.get('NFT.STATIC_PATH')
        )
        if (item.name == detail.name && item.img_uri == imgStorePath) {
          this.logger.debug('img is ok')
          continue
        }
        item.name = detail.name
        if (imgStorePath != item.img_uri) {
          item.img_uri = detail.image
        }
      }
      // }
      const imgPath = await this.utilsService.downloadImage(
        item.img_uri,
        config.get('NFT.STATIC_PATH')
      )
      this.logger.debug('loop ' + loop + ': ' + item.img_uri + ' ' + imgPath)
      // if (imgPath == item.img_uri) continue
      item.img_uri = imgPath
      await this.nftConnectionRunner.manager.save(item)
      await this.nftConnectionRunner.manager.update(
        NftTransferRecordEntity,
        {
          smart_contract_address: item.smart_contract_address,
          token_id: item.token_id
        },
        { img_uri: imgPath, name: item.name }
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
