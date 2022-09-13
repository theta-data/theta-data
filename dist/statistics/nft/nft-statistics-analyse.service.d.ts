import { SmartContractEntity } from 'src/block-chain/smart-contract/smart-contract.entity';
import { UtilsService } from 'src/common/utils.service';
import { MarketService } from 'src/market/market.service';
import { NftStatisticsEntity } from './nft-statistics.entity';
export declare class NftStatisticsAnalyseService {
    private utilsService;
    private marketService;
    private readonly logger;
    analyseKey: string;
    private smartContractConnection;
    private nftConnection;
    private nftStatisticsConnection;
    private heightConfigFile;
    private tfuelPrice;
    constructor(utilsService: UtilsService, marketService: MarketService);
    analyseData(): Promise<void>;
    nftStatistics(smartContractAddress: string): Promise<void>;
    setZero(): Promise<void>;
    updateNftsImgUri(): Promise<void>;
    syncNftInfo(smartContract: SmartContractEntity, nftStatistics: NftStatisticsEntity): Promise<void>;
    downloadAllImg(): Promise<void>;
}
