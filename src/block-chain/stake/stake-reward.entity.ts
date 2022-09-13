import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm'
import { registerEnumType } from '@nestjs/graphql'
export enum STAKE_TOKEN_TYPE_ENUM {
  theta_stake = 1,
  elite_node_stake
}
registerEnumType(STAKE_TOKEN_TYPE_ENUM, {
  name: 'STAKE_TOKEN_TYPE_ENUM'
})

@Entity()
@Index(['wallet_address', 'timestamp'])
@Unique(['wallet_address', 'reward_height'])
export class StakeRewardEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'real' })
  reward_amount: number

  @Column({ type: 'text' })
  wallet_address: string

  @Column({ type: 'integer' })
  reward_height: number

  @Column({
    type: 'integer'
  })
  timestamp: number

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
