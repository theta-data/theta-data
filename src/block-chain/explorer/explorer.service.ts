import { WalletService } from './../wallet/wallets.service'
import { BLOCK_COUNT_KEY, TRANSACTION_COUNT_KEY } from './const'
import { CountEntity } from './count.entity'
import { TransactionEntity } from './transaction.entity'
import { BlokcListEntity } from './block-list.entity'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, In, LessThan, Repository } from 'typeorm'

@Injectable()
export class ExplorerService {
  private logger = new Logger()
  constructor(
    @InjectRepository(BlokcListEntity, 'explorer')
    private blockListRepository: Repository<BlokcListEntity>,

    @InjectRepository(TransactionEntity, 'explorer')
    private transactionRepository: Repository<TransactionEntity>,

    @InjectRepository(CountEntity, 'explorer')
    private countRepository: Repository<CountEntity>,
    private walletService: WalletService
  ) {}

  public async getBlockList(
    take: number = 20,
    after: string | undefined,
    skip: number = 0
  ): Promise<[boolean, number, Array<BlokcListEntity>]> {
    const condition: FindManyOptions<BlokcListEntity> = {
      take: take + 1,
      skip: skip,
      order: {
        // id: 'ASC',
        height: 'DESC'
      }
    }
    if (after) {
      const height = Number(Buffer.from(after, 'base64').toString('ascii'))
      this.logger.debug('decode from base64:' + height)
      condition.where[height] = LessThan(height)
    }
    const totalBlock = (
      await this.countRepository.findOne({
        key: BLOCK_COUNT_KEY
      })
    ).count
    let blockList = await this.blockListRepository.find(condition)
    let hasNextPage = false
    if (blockList.length > take) {
      hasNextPage = true
      blockList = blockList.slice(0, take)
    }
    return [hasNextPage, totalBlock, blockList]
  }

  public async getTransactions(
    take: number = 20,
    after: string | undefined,
    skip: number = 0,
    blockHeight: number = 0
  ): Promise<[boolean, number, Array<TransactionEntity>]> {
    const condition: FindManyOptions<TransactionEntity> = {
      take: take + 1,
      skip: skip,
      order: {
        // id: 'ASC',
        id: 'DESC'
      },
      where: {}
    }
    if (blockHeight) {
      condition.where['height'] = blockHeight
    }
    if (after) {
      const id = Number(Buffer.from(after, 'base64').toString('ascii'))
      this.logger.debug('decode from base64:' + id)
      condition.where['id'] = LessThan(id)
    }
    let totalBlock = 0
    if (blockHeight) {
      totalBlock = await this.transactionRepository.count({
        height: blockHeight
      })
    } else {
      totalBlock = (
        await this.countRepository.findOne({
          key: TRANSACTION_COUNT_KEY
        })
      ).count
    }
    let blockList = await this.transactionRepository.find(condition)
    let hasNextPage = false
    if (blockList.length > take) {
      hasNextPage = true
      blockList = blockList.slice(0, take)
    }
    return [hasNextPage, totalBlock, blockList]
  }

  public async getBlockInfo(heightOrHash: number | string) {
    return await this.blockListRepository.findOne({
      where: [{ height: heightOrHash }, { block_hash: heightOrHash }]
    })
  }

  public async getTransactionInfo(hash) {
    return await this.transactionRepository.findOne({
      where: { tx_hash: hash }
    })
  }

  public async getAccount(walletAddress: string) {
    return await this.walletService.getWalletByAddress(walletAddress.toLowerCase())
  }

  public async getAccountTransactions(walletAddress: string, take: number, skip: number) {
    const wallet = await this.walletService.getWalletByAddress(walletAddress)
    if (!wallet) return null
    const txs = JSON.parse(wallet.txs_hash_list)
    if (txs.length <= take) {
      const txnObjects = await this.transactionRepository.find({
        where: { tx_hash: In(txs) }
      })
      return {
        wallet: wallet,
        txs: txnObjects,
        total: txs.length
        // currPage: 1
      }
    } else {
      const start = skip
      const end = skip + take
      const txnObjects = await this.transactionRepository.find({
        where: { tx_hash: In(txs.slice(start, end)) }
      })
      return {
        wallet: wallet,
        txs: txnObjects,
        total: txs.length
        // currPage: pageNum
      }
    }
  }
}
