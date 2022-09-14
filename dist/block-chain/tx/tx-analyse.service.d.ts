import { Connection } from 'typeorm';
import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/src/types/interface';
import { UtilsService } from 'src/common/utils.service';
export declare class TxAnalyseService {
    private utilsService;
    private readonly connection;
    private readonly logger;
    analyseKey: string;
    private counter;
    private txConnectionRunner;
    private heightConfigFile;
    constructor(utilsService: UtilsService, connection: Connection);
    analyseData(): Promise<void>;
    handleOrderCreatedEvent(block: THETA_BLOCK_INTERFACE, latestFinalizedBlockHeight: number): Promise<void>;
}
