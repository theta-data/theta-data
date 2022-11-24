import { UtilsService } from 'src/common/utils.service';
import { Connection } from 'typeorm';
import { RpcService } from 'src/block-chain/rpc/rpc.service';
export declare class WalletSendHistoryAnalyseService {
    private utilsService;
    private readonly connection;
    private rpcService;
    private readonly logger;
    private recordLogFile;
    private runner;
    constructor(utilsService: UtilsService, connection: Connection, rpcService: RpcService);
    analyse(): Promise<void>;
    private analyseBlock;
}