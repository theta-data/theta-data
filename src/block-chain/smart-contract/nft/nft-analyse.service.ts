import { NftTransferRecordEntity } from 'src/block-chain/smart-contract/nft/nft-transfer-record.entity'
import { NftBalanceEntity } from './nft-balance.entity'
import { Injectable, Logger } from '@nestjs/common'
import { getConnection, MoreThan, QueryRunner } from 'typeorm'
import { SmartContractCallRecordEntity } from 'src/block-chain/smart-contract/smart-contract-call-record.entity'
import { NftService } from 'src/block-chain/smart-contract/nft/nft.service'
import { UtilsService, writeFailExcuteLog, writeSucessExcuteLog } from 'src/common/utils.service'
const fs = require('fs')
import fetch from 'cross-fetch'
import { config } from 'src/const'

@Injectable()
export class NftAnalyseService {
  private readonly logger = new Logger('nft analyse service')
  analyseKey = 'under_analyse'

  private smartContractConnection: QueryRunner
  private nftConnection: QueryRunner
  private heightConfigFile = config.get('ORM_CONFIG')['database'] + 'nft/record.height'

  constructor(private nftService: NftService, private utilsService: UtilsService) {}

  public async analyseData(loop: number) {
    try {
      this.logger.debug(loop + ' start analyse nft data')
      // this.logger.debug(logoConfig)
      this.smartContractConnection = getConnection('smart_contract').createQueryRunner()
      this.nftConnection = getConnection('nft').createQueryRunner()

      await this.smartContractConnection.connect()
      await this.nftConnection.connect()
      await this.nftConnection.startTransaction()
      let startId: number = 0
      if (!fs.existsSync(this.heightConfigFile)) {
        fs.writeFileSync(this.heightConfigFile, '0')
      } else {
        const data = fs.readFileSync(this.heightConfigFile, 'utf8')
        if (data) {
          startId = Number(data)
        }
      }

      const contractRecordList = await this.smartContractConnection.manager.find(
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
      for (const record of contractRecordList) {
        promiseArr.push(
          this.nftService.updateNftRecord(this.nftConnection, this.smartContractConnection, record)
        )
        await Promise.all(promiseArr)
      }

      this.logger.debug('start update calltimes by period')
      if (config.get('NFT.DL_ALL_NFT_IMG') == true) {
        await this.downloadAllImg(loop)
      }

      await this.nftConnection.commitTransaction()
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
      await this.nftConnection.rollbackTransaction()
      writeFailExcuteLog(config.get('NFT.MONITOR_PATH'))
    } finally {
      await this.nftConnection.release()
      writeSucessExcuteLog(config.get('NFT.MONITOR_PATH'))
      this.logger.debug('end analyse nft data')
      this.logger.debug('release success')
    }
  }

  async downloadAllImg(loop: number) {
    const total = await this.nftConnection.manager.count(NftBalanceEntity)
    const pageSize = 100
    const pageCount = Math.ceil(total / pageSize)
    if (loop > pageCount) {
      this.logger.debug('loop ' + loop + ' page count:' + pageCount)
      return
    }
    // for (let i = 0; i < pageCount; i++) {
    const list = await this.nftConnection.manager.find(NftBalanceEntity, {
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
      await this.nftConnection.manager.save(item)
      await this.nftConnection.manager.update(
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
}
