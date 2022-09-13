export declare enum STAKE_NODE_TYPE_ENUM {
    validator = 0,
    guardian = 1,
    edge_cache = 2
}
export declare class Stake {
    source: string;
    amount: string;
    withdrawn: boolean;
    return_height: string;
}
export declare class StakeEntity {
    id: number;
    node_type: STAKE_NODE_TYPE_ENUM;
    holder: string;
    stakes: Array<Stake>;
    last_signature: number;
    update_height: number;
    create_date: number;
    update_date: number;
}
