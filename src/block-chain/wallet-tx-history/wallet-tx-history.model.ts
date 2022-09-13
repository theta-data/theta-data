import { TransactionEntity } from './../explorer/transaction.entity'
import { Paginated } from 'src/common/common.model'
import { ObjectType } from '@nestjs/graphql'

@ObjectType()
export class PaginatedHistoryTransactions extends Paginated(TransactionEntity) {}
