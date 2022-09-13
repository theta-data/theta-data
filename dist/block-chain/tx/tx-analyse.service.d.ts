import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/src/types/interface';
import { UtilsService } from 'src/common/utils.service';
export declare class TxAnalyseService {
    private utilsService;
    private readonly logger;
    analyseKey: string;
    private counter;
    private txConnection;
    private heightConfigFile;
    constructor(utilsService: UtilsService);
    analyseData(): Promise<void>;
    handleOrderCreatedEvent(block: THETA_BLOCK_INTERFACE, latestFinalizedBlockHeight: number): Promise<void>;
}
