import { TransactionEntity } from './../explorer/transaction.entity';
import { UtilsService } from 'src/common/utils.service';
export declare class WalletTxHistoryAnalyseService {
    private utilsService;
    private readonly logger;
    private walletConnection;
    private explorerConnection;
    private walletTxHistoryConnection;
    private heightConfigFile;
    constructor(utilsService: UtilsService);
    analyseData(): Promise<void>;
    addWallet(record: TransactionEntity, walletsToupdate: {
        [index: string]: Array<string>;
    }): Promise<void>;
    updateWalletTxHistory(walletsToupdate: {
        [index: string]: Array<string>;
    }): Promise<void>;
}
