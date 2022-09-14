import { SmartContractEntity } from 'src/block-chain/smart-contract/smart-contract.entity';
import { UtilsService } from 'src/common/utils.service';
import { MarketService } from 'src/market/market.service';
import { Connection } from 'typeorm';
import { NftStatisticsEntity } from './nft-statistics.entity';
export declare class NftStatisticsAnalyseService {
    private utilsService;
    private marketService;
    private smartContractConnectionInjected;
    private nftConnectionInjected;
    private nftStatisticsConnectionInjected;
    private readonly logger;
    analyseKey: string;
    private smartContractConnectionRunner;
    private nftConnectionRunner;
    private nftStatisticsConnectionRunner;
    private heightConfigFile;
    private tfuelPrice;
    constructor(utilsService: UtilsService, marketService: MarketService, smartContractConnectionInjected: Connection, nftConnectionInjected: Connection, nftStatisticsConnectionInjected: Connection);
    analyseData(): Promise<void>;
    nftStatistics(smartContractAddress: string): Promise<void>;
    setZero(): Promise<void>;
    updateNftsImgUri(): Promise<void>;
    syncNftInfo(smartContract: SmartContractEntity, nftStatistics: NftStatisticsEntity): Promise<void>;
    downloadAllImg(): Promise<void>;
}
