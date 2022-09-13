import { NftService } from 'src/block-chain/smart-contract/nft/nft.service';
import { UtilsService } from 'src/common/utils.service';
export declare class NftAnalyseService {
    private nftService;
    private utilsService;
    private readonly logger;
    analyseKey: string;
    private smartContractConnection;
    private nftConnection;
    private heightConfigFile;
    constructor(nftService: NftService, utilsService: UtilsService);
    analyseData(loop: number): Promise<void>;
    downloadAllImg(loop: number): Promise<void>;
}
