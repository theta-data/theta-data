import { THETA_TRANSACTION_TYPE_ENUM } from 'theta-ts-sdk/dist/types/enum'
// import { THETA_TX_TYPE_ENUM } from './../../tx/theta.enum';
// import { THETA_TX_TYPE_ENUM } from './../../tx/theta.enum'
// import { STAKE_NODE_TYPE_ENUM } from './../../stake/stake.entity'
import { STAKE_NODE_TYPE_ENUM } from 'src/block-chain/stake/stake.model'
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm'

@Entity()
@Index(['wallet_address', 'timestamp'])
@Unique(['wallet_address', 'node_address', 'height'])
export class WalletDpWdHistoryEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  wallet_address: string

  @Column()
  tx_hash: string

  @Column({
    type: 'float'
  })
  theta: number

  @Column({
    type: 'float'
  })
  tfuel: number

  @Column()
  node_address: string

  @Column({
    type: 'int'
  })
  node_type: STAKE_NODE_TYPE_ENUM

  @Column({
    type: 'int'
  })
  tx_type: THETA_TRANSACTION_TYPE_ENUM

  @Column({
    type: 'int'
  })
  height: number

  @Column({
    type: 'int'
  })
  timestamp: number

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
