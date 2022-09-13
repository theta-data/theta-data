import { THETA_TRANSACTION_TYPE_ENUM } from './../tx/theta.enum';
import { TransactionEntity } from './../explorer/transaction.entity';
import { Repository } from 'typeorm';
import { WalletTxHistoryEntity } from './wallet-tx-history.entity';
export declare class WalletTxHistoryService {
    private readonly walletTxHistoryRepository;
    private readonly transactionRepository;
    constructor(walletTxHistoryRepository: Repository<WalletTxHistoryEntity>, transactionRepository: Repository<TransactionEntity>);
    getTransactions(wallet: string, take: number, skip: number, txType: THETA_TRANSACTION_TYPE_ENUM | undefined): Promise<[boolean, number, TransactionEntity[]]>;
}
