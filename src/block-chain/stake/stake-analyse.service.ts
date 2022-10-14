import { LatestStakeInfoEntity } from './latest-stake-info.entity'
import { Injectable, Logger, SerializeOptions } from '@nestjs/common'
import { Connection, getConnection, LessThan, MoreThan, QueryRunner } from 'typeorm'
import { THETA_TRANSACTION_TYPE_ENUM } from 'theta-ts-sdk/dist/types/enum'
import { thetaTsSdk } from 'theta-ts-sdk'
import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/src/types/interface'
import BigNumber from 'bignumber.js'
import { StakeStatisticsEntity } from '../../block-chain/stake/stake-statistics.entity'
import { StakeRewardEntity } from '../../block-chain/stake/stake-reward.entity'
import { SmartContractEntity } from 'src/block-chain/smart-contract/smart-contract.entity'
import { UtilsService, writeFailExcuteLog, writeSucessExcuteLog } from 'src/common/utils.service'
import { STAKE_NODE_TYPE_ENUM } from './stake.entity'
import { config } from 'src/const'
import { InjectConnection } from '@nestjs/typeorm'
const moment = require('moment')
@Injectable()
export class StakeAnalyseService {
  private readonly logger = new Logger('stake analyse service')
  analyseKey = 'under_analyse'
  private counter = 0
  // private startTimestamp = 0

  private stakeConnectionRunner: QueryRunner
  private heightConfigFile = config.get('ORM_CONFIG')['database'] + 'stake/record.height'

  constructor(
    // private loggerService: LoggerService,
    private utilsService: UtilsService,
    @InjectConnection('stake') private stakeConnectionInjected: Connection
  ) {
    this.logger.debug(config.get('THETA_NODE_HOST'))
  }

  public async analyseData() {
    try {
      this.stakeConnectionRunner = this.stakeConnectionInjected.createQueryRunner()
      await this.stakeConnectionRunner.startTransaction()

      let height: number = 0
      const lastfinalizedHeight = Number(
        (await thetaTsSdk.blockchain.getStatus()).result.latest_finalized_block_height
      )
      height = lastfinalizedHeight - 1000

      if (config.get('STAKE.START_HEIGHT')) {
        height = config.get('STAKE.START_HEIGHT')
      }
      const recordHeight = this.utilsService.getRecordHeight(this.heightConfigFile)
      height = recordHeight > height ? recordHeight : height
      if (height >= lastfinalizedHeight) {
        this.logger.debug('commit success')
        this.logger.debug('no height to analyse')
        return await this.stakeConnectionRunner.commitTransaction()
      }
      // await this.
      let endHeight = lastfinalizedHeight
      const analyseNumber = config.get('STAKE.ANALYSE_NUMBER')
      if (lastfinalizedHeight - height > analyseNumber) {
        endHeight = height + analyseNumber
      }
      this.logger.debug('start height: ' + height + '; end height: ' + endHeight)
      // this.startTimestamp = moment().unix()
      const blockList = await thetaTsSdk.blockchain.getBlockSByRange(
        height.toString(),
        endHeight.toString()
      )
      this.logger.debug('block list length:' + blockList.result.length)
      this.counter = blockList.result.length
      this.logger.debug('init counter', this.counter)
      const lastAnalyseHeight = await this.stakeConnectionRunner.manager.findOne(
        StakeRewardEntity,
        {
          order: {
            id: 'DESC'
          },
          where: { id: MoreThan(0) }
        }
      )
      for (let i = 0; i < blockList.result.length; i++) {
        const block = blockList.result[i]
        if (lastAnalyseHeight && lastAnalyseHeight.reward_height >= Number(block.height)) {
          this.counter--
          continue
        }
        this.logger.debug(block.height + ' start hanldle')
        await this.handleOrderCreatedEvent(block, lastfinalizedHeight)
      }
      this.logger.debug('start update calltimes by period')
      await this.stakeConnectionRunner.commitTransaction()
      this.logger.debug('commit success')
      // if (blockList.result.length > 0) {
      this.utilsService.updateRecordHeight(
        this.heightConfigFile,
        Number(blockList.result[blockList.result.length - 1].height)
      )
      writeSucessExcuteLog(config.get('STAKE.MONITOR_PATH'))
      // }
    } catch (e) {
      // console.log(e)
      console.error(e.message)
      this.logger.error(e.message)
      this.logger.error('rollback')
      await this.stakeConnectionRunner.rollbackTransaction()
      writeFailExcuteLog(config.get('STAKE.MONITOR_PATH'))
      // process.exit(0)
    } finally {
      await this.stakeConnectionRunner.release()
      this.logger.debug('release success')
    }
  }

  // @OnEvent('block.analyse')
  async handleOrderCreatedEvent(block: THETA_BLOCK_INTERFACE, latestFinalizedBlockHeight: number) {
    this.logger.debug(block.height + ' start insert')

    const height = Number(block.height)
    const timestamp = moment(
      moment(Number(block.timestamp) * 1000).format('YYYY-MM-DD HH:00:00')
    ).unix()

    await this.updateCheckPoint(block)

    for (const transaction of block.transactions) {
      switch (transaction.type) {
        case THETA_TRANSACTION_TYPE_ENUM.coinbase:
          // if (latestFinalizedBlockHeight - height < 30 * 15000) {
          // const stakeRewardStart = moment().unix()
          const transacitonToBeUpserted = []
          for (const output of transaction.raw.outputs) {
            // this.logger.debug('upsert coinbae transaction')
            transacitonToBeUpserted.push({
              reward_amount: Number(
                new BigNumber(output.coins.tfuelwei).dividedBy('1e18').toFixed()
              ),
              wallet_address: output.address.toLocaleLowerCase(),
              reward_height: height,
              timestamp: Number(block.timestamp)
            })
            if (transacitonToBeUpserted.length > 900) {
              await this.stakeConnectionRunner.manager.insert(
                StakeRewardEntity,
                transacitonToBeUpserted
                // ['wallet_address', 'reward_height']
              )

              // this.loggerService.timeMonitor(height + ': stake reward upsert ', stakeRewardStart)
              transacitonToBeUpserted.length = 0
            }
          }
          await this.stakeConnectionRunner.manager.insert(
            StakeRewardEntity,
            transacitonToBeUpserted
          )

          this.logger.debug(height + ' end upsert stake reward')
          // }
          break
        default:
          // this.logger.error('no transaction.tx_type:' + transaction.type)
          break
      }
    }
    this.logger.debug(height + ' end update analyse')
    this.counter--
  }

  async updateCheckPoint(block: THETA_BLOCK_INTERFACE) {
    try {
      if (Number(block.height) % 100 !== 1) {
        this.logger.debug(block.height + ': not checkpoint block')
        return
      }
      this.logger.debug(block.height + ' start update check point')
      const vaRes = await this.updateValidator(block)
      if (!vaRes) return
      const [vaTotalNodeNum, vaEffectiveNodeNum, vaTotalThetaWei, vaEffectiveThetaWei] = vaRes
      const gnRes = await this.updateGuardian(block)
      if (!gnRes) return
      const [guTotalNodeNum, guEffectiveNodeNum, guTotalThetaWei, guEffectiveThetaWei] = gnRes
      // await this.updateGuardian(block)
      const eenpRes = await this.updateEenp(block)
      if (!eenpRes) return
      const [eenpTotalNodeNum, eenpEffectiveNodeNum, eenpTotalTfWei, eenpEffectiveTfWei]: [
        number,
        number,
        BigNumber,
        BigNumber
      ] = eenpRes
      let res = await this.stakeConnectionRunner.manager.findOne(StakeStatisticsEntity, {
        where: { block_height: Number(block.height) }
      })
      if (!res) {
        const stakeStatisticsInfo = {
          block_height: Number(block.height),

          total_elite_edge_node_number: eenpTotalNodeNum,
          effective_elite_edge_node_number: eenpEffectiveNodeNum,
          total_edge_node_stake_amount: parseInt(eenpTotalTfWei.dividedBy('1e18').toFixed()),
          effective_elite_edge_node_stake_amount: parseInt(
            eenpEffectiveTfWei.dividedBy('1e18').toFixed()
          ),
          theta_fuel_stake_ratio: Number(eenpTotalTfWei.dividedBy('5.399646029e27').toFixed()),
          timestamp: Number(block.timestamp),

          total_guardian_node_number: guTotalNodeNum,
          effective_guardian_node_number: guEffectiveNodeNum,
          total_guardian_stake_amount: parseInt(guTotalThetaWei.dividedBy('1e18').toFixed()),
          effective_guardian_stake_amount: Number(guEffectiveThetaWei.dividedBy('1e18').toFixed()),

          theta_stake_ratio: Number(
            guTotalThetaWei.plus(vaTotalThetaWei).dividedBy('1e27').toFixed()
          ),

          total_validator_node_number: vaTotalNodeNum,
          effective_validator_node_number: vaEffectiveNodeNum,
          effective_validator_stake_amount: parseInt(
            vaEffectiveThetaWei.dividedBy('1e18').toFixed()
          ),
          total_validator_stake_amount: parseInt(vaTotalThetaWei.dividedBy('1e18').toFixed())
        }
        this.logger.debug('insert stake statistics info', JSON.stringify(stakeStatisticsInfo))
        try {
          return await this.stakeConnectionRunner.manager.insert(
            StakeStatisticsEntity,
            stakeStatisticsInfo
          )
        } catch (e) {
          this.logger.error('insert stake statistics error:' + JSON.stringify(e))
          // console.log(e)
        }
      }
    } catch (e) {
      this.logger.error('updateCheckPoint error:' + JSON.stringify(e))
      // console.log(e)
    }
  }

  async updateValidator(
    block: THETA_BLOCK_INTERFACE
  ): Promise<[number, number, BigNumber, BigNumber] | false> {
    let totalNodeNum = 0,
      effectiveNodeNum = 0,
      totalThetaWei = new BigNumber(0),
      effectiveThetaWei = new BigNumber(0)
    this.logger.debug('start get va list')
    const validatorList = await thetaTsSdk.blockchain.getVcpByHeight(block.height)
    this.logger.debug('end get va list')
    if (!validatorList.result || !validatorList.result.BlockHashVcpPairs) {
      this.logger.error('no validator BlockHashVcpPairs')
      return false
      // throw new Error('no validator BlockHashVcpPairs')
    }
    const latestVa = await this.stakeConnectionRunner.manager.findOne(LatestStakeInfoEntity, {
      where: { node_type: STAKE_NODE_TYPE_ENUM.validator }
    })
    if (!latestVa) {
      await this.stakeConnectionRunner.manager.insert(LatestStakeInfoEntity, {
        height: Number(block.height),
        node_type: STAKE_NODE_TYPE_ENUM.validator,
        holder: JSON.stringify(validatorList)
      })
    } else {
      await this.stakeConnectionRunner.manager.update(
        LatestStakeInfoEntity,
        {
          node_type: STAKE_NODE_TYPE_ENUM.validator
        },
        {
          height: Number(block.height),
          node_type: STAKE_NODE_TYPE_ENUM.validator,
          holder: JSON.stringify(validatorList)
        }
      )
    }

    // ['node_type']
    // )
    validatorList.result.BlockHashVcpPairs[0].Vcp.SortedCandidates.forEach((node) => {
      totalNodeNum++
      node.Stakes.forEach((stake) => {
        // if (stake.withdrawn === false) {
        totalThetaWei = totalThetaWei.plus(new BigNumber(stake.amount))
        block.hcc.Votes.forEach((vote) => {
          if (vote.ID === node.Holder && !stake.withdrawn) {
            effectiveNodeNum++
            effectiveThetaWei = effectiveThetaWei.plus(new BigNumber(stake.amount))
          }
        })
      })
    })
    return [totalNodeNum, effectiveNodeNum, totalThetaWei, effectiveThetaWei]
  }

  async updateGuardian(
    block: THETA_BLOCK_INTERFACE
  ): Promise<[number, number, BigNumber, BigNumber] | false> {
    let totalNodeNum = 0,
      effectiveNodeNum = 0,
      totalThetaWei = new BigNumber(0),
      effectiveThetaWei = new BigNumber(0)
    this.logger.debug('start get gn list')
    const gcpList = await thetaTsSdk.blockchain.getGcpByHeight(block.height)
    this.logger.debug('end get gn list')
    if (!gcpList.result || !gcpList.result.BlockHashGcpPairs) {
      this.logger.error('no guardian BlockHashVcpPairs')
      return false
      // throw new Error('no validator BlockHashVcpPairs')
    }
    const latestGn = await this.stakeConnectionRunner.manager.findOne(LatestStakeInfoEntity, {
      where: { node_type: STAKE_NODE_TYPE_ENUM.guardian }
    })
    if (!latestGn) {
      await this.stakeConnectionRunner.manager.insert(LatestStakeInfoEntity, {
        height: Number(block.height),
        node_type: STAKE_NODE_TYPE_ENUM.guardian,
        holder: JSON.stringify(gcpList)
      })
    } else {
      await this.stakeConnectionRunner.manager.update(
        LatestStakeInfoEntity,
        { node_type: STAKE_NODE_TYPE_ENUM.guardian },
        {
          height: Number(block.height),
          node_type: STAKE_NODE_TYPE_ENUM.guardian,
          holder: JSON.stringify(gcpList)
        }
      )
    }

    for (const guardian of gcpList.result.BlockHashGcpPairs[0].Gcp.SortedGuardians) {
      totalNodeNum++
      guardian.Stakes.forEach((stake) => {
        totalThetaWei = totalThetaWei.plus(new BigNumber(stake.amount))
      })
    }
    for (let i = 0; i < block.guardian_votes.Multiplies.length; i++) {
      if (block.guardian_votes.Multiplies[i] !== 0) {
        // await this.stakeService.updateGcpStatus(
        gcpList.result.BlockHashGcpPairs[0].Gcp.SortedGuardians[i].Stakes.forEach((stake) => {
          if (stake.withdrawn == false) {
            effectiveThetaWei = effectiveThetaWei.plus(new BigNumber(stake.amount))
          }
        })
        effectiveNodeNum++
      }
    }
    this.logger.debug('end gn analyse')
    return [totalNodeNum, effectiveNodeNum, totalThetaWei, effectiveThetaWei]
  }

  async updateEenp(
    block: THETA_BLOCK_INTERFACE
  ): Promise<[number, number, BigNumber, BigNumber] | false> {
    let totalNodeNum = 0,
      effectiveNodeNum = 0,
      totalTfuelWei = new BigNumber(0),
      effectiveTfuelWei = new BigNumber(0)
    this.logger.debug('start get een list')
    const eenpList = await thetaTsSdk.blockchain.getEenpByHeight(block.height)
    this.logger.debug('end get een list')
    if (!eenpList.result || !eenpList.result.BlockHashEenpPairs) {
      this.logger.error('no guardian BlockHashVcpPairs')
      return false
      // return false
      // throw new Error('no validator BlockHashVcpPairs')
    }
    const een = await this.stakeConnectionRunner.manager.findOne(LatestStakeInfoEntity, {
      where: { node_type: STAKE_NODE_TYPE_ENUM.edge_cache }
    })
    if (!een) {
      await this.stakeConnectionRunner.manager.insert(LatestStakeInfoEntity, {
        height: Number(block.height),
        node_type: STAKE_NODE_TYPE_ENUM.edge_cache,
        holder: JSON.stringify(eenpList)
      })
    } else {
      await this.stakeConnectionRunner.manager.update(
        LatestStakeInfoEntity,
        { node_type: STAKE_NODE_TYPE_ENUM.edge_cache },
        {
          height: Number(block.height),
          node_type: STAKE_NODE_TYPE_ENUM.edge_cache,
          holder: JSON.stringify(eenpList)
        }
      )
    }

    eenpList.result.BlockHashEenpPairs[0].EENs.forEach((eenp) => {
      totalNodeNum++
      let isEffectiveNode = false
      block.elite_edge_node_votes.Multiplies.forEach((value, index) => {
        if (block.elite_edge_node_votes.Addresses[index] == eenp.Holder && value !== 0) {
          isEffectiveNode = true
          effectiveNodeNum++
        }
      })
      eenp.Stakes.forEach((stake) => {
        totalTfuelWei = totalTfuelWei.plus(new BigNumber(stake.amount))
        if (isEffectiveNode && !stake.withdrawn) {
          effectiveTfuelWei = effectiveTfuelWei.plus(new BigNumber(stake.amount))
        }
      })
    })
    return [totalNodeNum, effectiveNodeNum, totalTfuelWei, effectiveTfuelWei]
  }
}
