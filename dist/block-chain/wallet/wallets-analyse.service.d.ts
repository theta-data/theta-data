import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/src/types/interface';
import { LoggerService } from 'src/common/logger.service';
import { UtilsService } from 'src/common/utils.service';
export declare class WalletsAnalyseService {
    private loggerService;
    private utilsService;
    private readonly logger;
    analyseKey: string;
    private counter;
    private startTimestamp;
    private walletConnection;
    private heightConfigFile;
    constructor(loggerService: LoggerService, utilsService: UtilsService);
    analyseData(): Promise<void>;
    handleOrderCreatedEvent(block: THETA_BLOCK_INTERFACE, latestFinalizedBlockHeight: number): Promise<void>;
    dealBlocks(blocks: Array<THETA_BLOCK_INTERFACE>): Promise<void>;
    updateWallets(wallets: {}, address: string, hash: string, timestamp: number): Promise<void>;
    snapShotActiveWallets(timestamp: number): Promise<boolean>;
}
