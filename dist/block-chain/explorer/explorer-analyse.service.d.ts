import { UtilsService } from 'src/common/utils.service';
import { DataSource } from 'typeorm';
import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/dist/types/interface';
export declare class ExplorerAnalyseService {
    private utilsService;
    private readonly explorerConnectionInjected;
    private explorerConnectionRunner;
    private readonly logger;
    private heightConfigFile;
    private current;
    private transactionNum;
    constructor(utilsService: UtilsService, explorerConnectionInjected: DataSource);
    analyse(): Promise<void>;
    handleData(block: THETA_BLOCK_INTERFACE): Promise<import("typeorm").InsertResult>;
    getInitHeight(configPath: string): Promise<[Number, Number]>;
}
