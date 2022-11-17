import { fieldsList } from 'graphql-fields-list'
import { THETA_TRANSACTION_TYPE_ENUM } from './../tx/theta.enum'
import { HistoryTransactionsModel, PaginatedHistoryTransactions } from './wallet-tx-history.model'
import { WalletTxHistoryService } from './wallet-tx-history.service'
import { Args, Info, Int, Query, Resolver } from '@nestjs/graphql'
import { GraphQLInt } from 'graphql'
const moment = require('moment')
@Resolver(() => PaginatedHistoryTransactions)
export class WalletTxHistoryResolver {
  constructor(private walletTxHistoryService: WalletTxHistoryService) {}

  @Query(() => PaginatedHistoryTransactions)
  async TxHistory(
    @Args('wallet_address') walletAddress: string,
    @Args('take', { type: () => Int, defaultValue: 10 }) take: number,
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
    @Args('tx_type', {
      type: () => THETA_TRANSACTION_TYPE_ENUM,
      defaultValue: undefined,
      nullable: true
    })
    txType: number
  ) {
    const [hasNextPage, totalNumber, res] = await this.walletTxHistoryService.getTransactions(
      walletAddress.toLocaleLowerCase(),
      take,
      skip,
      txType
    )
    return {
      hasNextPage: hasNextPage,
      nodes: res,
      totalCount: totalNumber,
      take: take,
      skip: skip,
      endCursor: skip + res.length
    }
  }

  @Query(() => HistoryTransactionsModel)
  async ActivityHistory(
    @Info() info,
    @Args('wallet_address') walletAddress: string,
    @Args('start_time', { type: () => GraphQLInt }) startTime: number,
    @Args('end_time', { type: () => GraphQLInt }) endTime: number
  ) {
    const history = new HistoryTransactionsModel()
    if (!startTime) startTime = moment().subtract(7, 'days').unix()
    if (!endTime) endTime = moment().unix()
    for (const field of fieldsList(info)) {
      history[field] = await this.walletTxHistoryService.getActivityHistory(
        //@ts-ignore
        field,
        walletAddress.toLocaleLowerCase(),
        startTime,
        endTime
      )
    }
    return history
  }
}
