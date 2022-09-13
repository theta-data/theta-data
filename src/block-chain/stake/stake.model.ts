import { TokenBalanceType } from '../wallet/wallet-balance.model'
import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class StakeRewardModel {
  @Field(() => TokenBalanceType, { nullable: true })
  last_24_hour: TokenBalanceType

  @Field(() => TokenBalanceType, { nullable: true })
  last_3_days: TokenBalanceType

  @Field(() => TokenBalanceType, { nullable: true })
  last_7_days: TokenBalanceType
}
