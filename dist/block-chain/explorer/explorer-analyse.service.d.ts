import { UtilsService } from 'src/common/utils.service';
import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/dist/types/interface';
export declare class ExplorerAnalyseService {
    private utilsService;
    private explorerConnection;
    private readonly logger;
    private heightConfigFile;
    private current;
    private transactionNum;
    constructor(utilsService: UtilsService);
    getInitHeight(configPath: string): Promise<[Number, Number]>;
    analyseData(): Promise<void>;
    handleData(block: THETA_BLOCK_INTERFACE): Promise<import("typeorm").InsertResult>;
}
