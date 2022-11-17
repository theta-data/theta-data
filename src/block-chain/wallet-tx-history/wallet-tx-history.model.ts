import { NftTransferRecordEntity } from 'src/block-chain/smart-contract/nft/nft-transfer-record.entity'
import { StakeRewardEntity } from './../stake/stake-reward.entity'
import { TransactionEntity } from './../explorer/transaction.entity'
import { Paginated } from 'src/common/common.model'
import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class PaginatedHistoryTransactions extends Paginated(TransactionEntity) {}

@ObjectType()
export class HistoryTransactionsModel {
  @Field(() => [StakeRewardEntity], { nullable: true })
  stake_rewards: Array<StakeRewardEntity>

  @Field(() => [NftTransferRecordEntity], { nullable: true })
  nft_transfers: Array<NftTransferRecordEntity>
}
