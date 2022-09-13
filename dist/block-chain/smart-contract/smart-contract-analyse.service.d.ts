import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/src/types/interface';
import { LoggerService } from 'src/common/logger.service';
import { UtilsService } from 'src/common/utils.service';
import { SmartContractService } from 'src/block-chain/smart-contract/smart-contract.service';
export declare class SmartContractAnalyseService {
    private loggerService;
    private utilsService;
    private smartContractService;
    private readonly logger;
    analyseKey: string;
    private counter;
    private startTimestamp;
    private smartContractConnection;
    private heightConfigFile;
    private smartContractList;
    constructor(loggerService: LoggerService, utilsService: UtilsService, smartContractService: SmartContractService);
    analyseData(): Promise<void>;
    handleOrderCreatedEvent(block: THETA_BLOCK_INTERFACE, latestFinalizedBlockHeight: number): Promise<void>;
    verifyWithThetaExplorer(address: string): Promise<any>;
    updateCallTimesByPeriod(contractAddress: string): Promise<void>;
    clearCallTimeByPeriod(): Promise<void>;
}
