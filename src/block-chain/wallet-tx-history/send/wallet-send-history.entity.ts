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
@Index(['from', 'timestamp'])
@Index(['to', 'timestamp'])
@Unique(['from', 'to', 'tx_hash'])
export class WalletSendHistoryEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  from: string

  @Column()
  to: string

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

  @Column({
    type: 'int'
  })
  timestamp: number

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
