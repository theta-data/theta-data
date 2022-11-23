import { thetaTsSdk } from 'theta-ts-sdk'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThan, MoreThanOrEqual, Repository } from 'typeorm'
import { StakeStatisticsEntity } from './stake-statistics.entity'
import { Injectable, Logger, CACHE_MANAGER, Inject } from '@nestjs/common'
import { StakeRewardEntity } from './stake-reward.entity'
// import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common'
import { Cache } from 'cache-manager'

const moment = require('moment')

@Injectable()
export class StakeService {
  logger = new Logger()
  constructor(
    @InjectRepository(StakeStatisticsEntity, 'stake')
    private stakeStatisticsRepository: Repository<StakeStatisticsEntity>,
    @InjectRepository(StakeRewardEntity, 'stake')
    private stakeRewardRepository: Repository<StakeRewardEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
    // thetaTsSdk.blockchain.setUrl(config.get('THETA_NODE_HOST'))
  }

  // async getNodeList(nodeType: STAKE_NODE_TYPE_ENUM | undefined) {
  //   this.logger.debug('node type:' + nodeType)
  //   if (typeof nodeType !== 'undefined')
  //     return await this.stakeRepository.find({
  //       where: { node_type: nodeType }
  //     })
  //   return await this.stakeRepository.find()
  // }

  // async getNodeNum(latestBlock: string, nodeType: STAKE_NODE_TYPE_ENUM) {
  //   let effectNodeNum = 0
  //   let stakeList = await this.stakeRepository.find({
  //     where: { node_type: nodeType }
  //   })
  //   stakeList.forEach((node) => {
  //     node.stakes.some((stake) => {
  //       if (
  //         stake.withdrawn == false ||
  //         (stake.withdrawn == true && Number(latestBlock) < Number(stake.return_height))
  //       ) {
  //         effectNodeNum++
  //         return true
  //       }
  //     })
  //   })
  //   return effectNodeNum
  // }

  // async updateVcp(height: string) {
  //   let vcpList = await thetaTsSdk.blockchain.getVcpByHeight(height)
  //   for (const validator of vcpList.result.BlockHashVcpPairs[0].Vcp.SortedCandidates) {
  //     let res = await this.stakeRepository.findOne({
  //       where: { holder: validator.Holder, node_type: STAKE_NODE_TYPE_ENUM.validator }
  //     })
  //     if (!res)
  //       await this.stakeRepository.insert({
  //         node_type: STAKE_NODE_TYPE_ENUM.validator,
  //         holder: validator.Holder,
  //         stakes: validator.Stakes
  //       })
  //     else
  //       await this.stakeRepository.update(
  //         { holder: validator.Holder, node_type: STAKE_NODE_TYPE_ENUM.validator },
  //         {
  //           stakes: validator.Stakes
  //         }
  //       )
  //   }
  // }

  // async updateGcp(height: string) {
  //   let gcpList = await thetaTsSdk.blockchain.getGcpByHeight(height)
  //   for (const guardian of gcpList.result.BlockHashGcpPairs[0].Gcp.SortedGuardians) {
  //     let res = await this.stakeRepository.findOne({
  //       where: { node_type: STAKE_NODE_TYPE_ENUM.guardian, holder: guardian.Holder }
  //     })
  //     if (!res)
  //       await this.stakeRepository.insert({
  //         node_type: STAKE_NODE_TYPE_ENUM.guardian,
  //         holder: guardian.Holder,
  //         stakes: guardian.Stakes
  //       })
  //     else
  //       await this.stakeRepository.update(
  //         { node_type: STAKE_NODE_TYPE_ENUM.guardian, holder: guardian.Holder },
  //         { stakes: guardian.Stakes }
  //       )
  //   }
  // }

  // async updateEenp(height: string) {
  //   let eenpList = await thetaTsSdk.blockchain.getEenpByHeight(height)
  //   for (const een of eenpList.result.BlockHashEenpPairs[0].EENs) {
  //     let res = await this.stakeRepository.findOne({
  //       where: { node_type: STAKE_NODE_TYPE_ENUM.edge_cache, holder: een.Holder }
  //     })
  //     if (!res)
  //       await this.stakeRepository.insert({
  //         node_type: STAKE_NODE_TYPE_ENUM.edge_cache,
  //         holder: een.Holder,
  //         stakes: een.Stakes
  //       })
  //     else
  //       await this.stakeRepository.update(
  //         {
  //           node_type: STAKE_NODE_TYPE_ENUM.edge_cache,
  //           holder: een.Holder
  //         },
  //         { stakes: een.Stakes }
  //       )
  //   }
  // }

  async getLatestFinalizedBlock() {
    let nodeInfo = await thetaTsSdk.blockchain.getStatus()
    return nodeInfo.result.latest_finalized_block_height
  }

  async getLatestStakeStatics() {
    const key = 'latest-stake-info-key'
    if (await this.cacheManager.get(key)) return await this.cacheManager.get(key)
    const latestStakeInfo = await this.stakeStatisticsRepository.findOne({
      where: {
        id: MoreThan(0)
      },
      order: {
        block_height: 'DESC'
      }
    })
    if (latestStakeInfo) {
      this.logger.debug('latest block height:' + latestStakeInfo.block_height)
      const stakeInfo = await this.stakeStatisticsRepository.find({
        where: {
          block_height: MoreThanOrEqual(latestStakeInfo.block_height - 13800 * 7)
        },
        order: {
          block_height: 'ASC'
        }
      })
      await this.cacheManager.set(key, stakeInfo, { ttl: 60 * 5 })
      return stakeInfo
    } else {
      return []
    }
  }

  // async updateGcpStatus(address: string, time: number) {
  //   await this.stakeRepository.update(
  //     { node_type: STAKE_NODE_TYPE_ENUM.guardian, holder: address },
  //     {
  //       last_signature: time
  //     }
  //   )
  // }

  // async updateEenpStatus(address: string, time: number) {
  //   await this.stakeRepository.update(
  //     { node_type: STAKE_NODE_TYPE_ENUM.edge_cache, holder: address },
  //     {
  //       last_signature: time
  //     }
  //   )
  // }

  // @Cron(CronExpression.EVERY_10_MINUTES)
  // async updateStakeInfo() {
  //   let nodeInfo = await thetaTsSdk.blockchain.getStatus()
  //   // console.log('node info', JSON.stringify(nodeInfo))
  //   await this.updateVcp(nodeInfo.result.latest_finalized_block_height)
  //   await this.updateGcp(nodeInfo.result.latest_finalized_block_height)
  //   await this.updateEenp(nodeInfo.result.latest_finalized_block_height)
  // }

  async getStakeReward(
    wallet_address: string,
    period: 'last_24_hour' | 'last_3_days' | 'last_7_days' | 'last_30_days'
  ) {
    let rewardList: Array<StakeRewardEntity> = []
    this.logger.debug('period:' + period)
    this.logger.debug('wallet:' + wallet_address)
    switch (period) {
      case 'last_24_hour':
        rewardList = await this.stakeRewardRepository.find({
          where: {
            timestamp: MoreThan(moment().subtract(24, 'hours').unix()),
            wallet_address: wallet_address
          }
        })
        break
      case 'last_7_days':
        rewardList = await this.stakeRewardRepository.find({
          where: {
            timestamp: MoreThan(moment().subtract(7, 'days').unix()),
            wallet_address: wallet_address
          }
        })
        break
      case 'last_3_days':
        rewardList = await this.stakeRewardRepository.find({
          where: {
            timestamp: MoreThan(moment().subtract(3, 'days').unix()),
            wallet_address: wallet_address
          }
        })
        break
      case 'last_30_days':
        rewardList = await this.stakeRewardRepository.find({
          where: {
            timestamp: MoreThan(moment().subtract(3, 'days').unix()),
            wallet_address: wallet_address
          }
        })
        break
      default:
        break
    }
    return rewardList.reduce((oldValue, reward) => {
      return oldValue + reward.reward_amount
    }, 0)
  }
}
