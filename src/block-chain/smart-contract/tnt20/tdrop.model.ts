import { Field, ObjectType } from '@nestjs/graphql'
import { GraphQLInt } from 'graphql'

@ObjectType()
export class TdropMinedByNft {
  @Field()
  recipient: string

  @Field(() => GraphQLInt)
  amount: number
}

@ObjectType()
export class TdropStakeReward {
  @Field()
  recipient: string

  @Field(() => GraphQLInt)
  amount: number
}

@ObjectType()
export class TdropTransfer {
  @Field()
  from: string

  @Field()
  to: string

  @Field(() => GraphQLInt)
  amount: number
}
