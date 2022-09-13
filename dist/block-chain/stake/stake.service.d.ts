import { STAKE_NODE_TYPE_ENUM, StakeEntity } from './stake.entity';
import { Repository } from 'typeorm';
import { StakeStatisticsEntity } from './stake-statistics.entity';
import { Logger } from '@nestjs/common';
import { StakeRewardEntity } from './stake-reward.entity';
import { Cache } from 'cache-manager';
export declare class StakeService {
    private stakeRepository;
    private stakeStatisticsRepository;
    private stakeRewardRepository;
    private cacheManager;
    logger: Logger;
    constructor(stakeRepository: Repository<StakeEntity>, stakeStatisticsRepository: Repository<StakeStatisticsEntity>, stakeRewardRepository: Repository<StakeRewardEntity>, cacheManager: Cache);
    getNodeList(nodeType: STAKE_NODE_TYPE_ENUM | undefined): Promise<StakeEntity[]>;
    getNodeNum(latestBlock: string, nodeType: STAKE_NODE_TYPE_ENUM): Promise<number>;
    updateVcp(height: string): Promise<void>;
    updateGcp(height: string): Promise<void>;
    updateEenp(height: string): Promise<void>;
    getLatestFinalizedBlock(): Promise<string>;
    getLatestStakeStatics(): Promise<unknown>;
    updateGcpStatus(address: string, time: number): Promise<void>;
    updateEenpStatus(address: string, time: number): Promise<void>;
    updateStakeInfo(): Promise<void>;
    getStakeReward(wallet_address: string, period: 'last_24_hour' | 'last_3_days' | 'last_7_days' | 'last_30_days'): Promise<number>;
}
