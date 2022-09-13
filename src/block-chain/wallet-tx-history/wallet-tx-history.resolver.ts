import { THETA_TRANSACTION_TYPE_ENUM } from './../tx/theta.enum'
import { PaginatedHistoryTransactions } from './wallet-tx-history.model'
import { WalletTxHistoryService } from './wallet-tx-history.service'
import { Args, Int, Query, registerEnumType, Resolver } from '@nestjs/graphql'
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
}
