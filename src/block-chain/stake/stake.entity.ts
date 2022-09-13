import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql'
import { GraphQLBoolean } from 'graphql'

export enum STAKE_NODE_TYPE_ENUM {
  validator,
  guardian,
  edge_cache
}

registerEnumType(STAKE_NODE_TYPE_ENUM, { name: 'STAKE_NODE_TYPE_ENUM' })

@ObjectType()
export class Stake {
  @Field()
  source: string //"0x4aefa39caeadd662ae31ab0ce7c8c2c9c0a013e8",

  @Field()
  amount: string //"20000000000000000000000000",

  @Field(() => GraphQLBoolean)
  withdrawn: boolean //false,

  @Field()
  return_height: string //"18446744073709551615"
}

@Entity()
@Index(['node_type'])
@ObjectType()
export class StakeEntity {
  // @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number

  @Field(() => STAKE_NODE_TYPE_ENUM)
  @Column({ type: 'int' })
  node_type: STAKE_NODE_TYPE_ENUM

  @Field({ nullable: true })
  @Column()
  holder: string

  @Field(() => [Stake])
  @Column({ type: 'text' })
  stakes: Array<Stake>

  @Field({ nullable: true })
  @Column({
    type: 'int'
  })
  last_signature: number

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  update_height: number

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
