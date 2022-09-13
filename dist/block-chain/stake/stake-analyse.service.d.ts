import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/src/types/interface';
import BigNumber from 'bignumber.js';
import { UtilsService } from 'src/common/utils.service';
export declare class StakeAnalyseService {
    private utilsService;
    private readonly logger;
    analyseKey: string;
    private counter;
    private stakeConnection;
    private heightConfigFile;
    constructor(utilsService: UtilsService);
    analyseData(): Promise<void>;
    handleOrderCreatedEvent(block: THETA_BLOCK_INTERFACE, latestFinalizedBlockHeight: number): Promise<void>;
    updateCheckPoint(block: THETA_BLOCK_INTERFACE): Promise<import("typeorm").InsertResult>;
    updateValidator(block: THETA_BLOCK_INTERFACE): Promise<[number, number, BigNumber, BigNumber] | false>;
    updateGuardian(block: THETA_BLOCK_INTERFACE): Promise<[number, number, BigNumber, BigNumber] | false>;
    updateEenp(block: THETA_BLOCK_INTERFACE): Promise<[number, number, BigNumber, BigNumber] | false>;
}