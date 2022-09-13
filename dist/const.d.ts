export declare const DEFAULT_CONFIG: {
    ORM_CONFIG: {
        database: string;
        synchronize: boolean;
        autoLoadEntities: boolean;
        name: string;
        type: string;
        entities: string[];
        bigNumberStrings: boolean;
        logging: boolean;
        extra: {
            charset: string;
        };
    };
    START_HEIGHT: number;
    THETA_NODE_HOST: string;
    LOG_PATH: string;
    ANALYSE_INTERVAL: number;
    ANALYSE_NUMBER: number;
    IGNORE: boolean;
    RATE_LIMIT: {
        ttl: number;
        limit: number;
    };
    SMART_CONTRACT_VERIFY_DETECT_TIMES: number;
    RE_SYNC_BALANCE: boolean;
    STAKE_ANALYSE_START_HEIGHT: number;
    CONFLICT_TRANSACTIONS: string[];
    NFT: {
        ANALYSE_NUMBER: number;
        ANALYSE_INTERVAL: number;
        DL_ALL_NFT_IMG: boolean;
        STATIC_PATH: string;
    };
    SMART_CONTRACT: {
        ANALYSE_NUMBER: number;
        ANALYSE_INTERVAL: number;
        THETA_NODE_HOST: string;
        START_HEIGHT: number;
    };
    NFT_STATISTICS: {
        ANALYSE_NUMBER: number;
        ANALYSE_INTERVAL: number;
        STATIC_PATH: string;
    };
    EXPLORER: {
        ANALYSE_NUMBER: number;
        ANALYSE_INTERVAL: number;
        START_HEIGHT: number;
    };
    STAKE: {
        ANALYSE_NUMBER: number;
        ANALYSE_INTERVAL: number;
        START_HEIGHT: number;
    };
    TX: {
        ANALYSE_NUMBER: number;
        ANALYSE_INTERVAL: number;
        START_HEIGHT: number;
    };
    WALLET: {
        START_HEIGHT: number;
        ANALYSE_NUMBER: number;
        ANALYSE_INTERVAL: number;
    };
};
export declare const config: {
    get: (str: string) => any;
};