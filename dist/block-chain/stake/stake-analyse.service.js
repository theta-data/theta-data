"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StakeAnalyseService = void 0;
const latest_stake_info_entity_1 = require("./latest-stake-info.entity");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const enum_1 = require("theta-ts-sdk/dist/types/enum");
const theta_ts_sdk_1 = require("theta-ts-sdk");
const bignumber_js_1 = require("bignumber.js");
const stake_statistics_entity_1 = require("../../block-chain/stake/stake-statistics.entity");
const stake_reward_entity_1 = require("../../block-chain/stake/stake-reward.entity");
const utils_service_1 = require("../../common/utils.service");
const stake_entity_1 = require("./stake.entity");
const const_1 = require("../../const");
const typeorm_2 = require("@nestjs/typeorm");
const moment = require('moment');
let StakeAnalyseService = class StakeAnalyseService {
    constructor(utilsService, stakeConnectionInjected) {
        this.utilsService = utilsService;
        this.stakeConnectionInjected = stakeConnectionInjected;
        this.logger = new common_1.Logger('stake analyse service');
        this.analyseKey = 'under_analyse';
        this.counter = 0;
        this.heightConfigFile = const_1.config.get('ORM_CONFIG')['database'] + 'stake/record.height';
        this.logger.debug(const_1.config.get('THETA_NODE_HOST'));
    }
    async analyseData() {
        try {
            this.stakeConnectionRunner = this.stakeConnectionInjected.createQueryRunner();
            await this.stakeConnectionRunner.startTransaction();
            let height = 0;
            const lastfinalizedHeight = Number((await theta_ts_sdk_1.thetaTsSdk.blockchain.getStatus()).result.latest_finalized_block_height);
            height = lastfinalizedHeight - 1000;
            if (const_1.config.get('STAKE.START_HEIGHT')) {
                height = const_1.config.get('STAKE.START_HEIGHT');
            }
            const recordHeight = this.utilsService.getRecordHeight(this.heightConfigFile);
            height = recordHeight > height ? recordHeight : height;
            if (height >= lastfinalizedHeight) {
                this.logger.debug('commit success');
                this.logger.debug('no height to analyse');
                return await this.stakeConnectionRunner.commitTransaction();
            }
            let endHeight = lastfinalizedHeight;
            const analyseNumber = const_1.config.get('STAKE.ANALYSE_NUMBER');
            if (lastfinalizedHeight - height > analyseNumber) {
                endHeight = height + analyseNumber;
            }
            this.logger.debug('start height: ' + height + '; end height: ' + endHeight);
            const blockList = await theta_ts_sdk_1.thetaTsSdk.blockchain.getBlockSByRange(height.toString(), endHeight.toString());
            this.logger.debug('block list length:' + blockList.result.length);
            this.counter = blockList.result.length;
            this.logger.debug('init counter', this.counter);
            const lastAnalyseHeight = await this.stakeConnectionRunner.manager.findOne(stake_reward_entity_1.StakeRewardEntity, {
                order: {
                    id: 'DESC'
                },
                where: { id: (0, typeorm_1.MoreThan)(0) }
            });
            for (let i = 0; i < blockList.result.length; i++) {
                const block = blockList.result[i];
                if (lastAnalyseHeight && lastAnalyseHeight.reward_height >= Number(block.height)) {
                    this.counter--;
                    continue;
                }
                this.logger.debug(block.height + ' start hanldle');
                await this.handleOrderCreatedEvent(block, lastfinalizedHeight);
            }
            this.logger.debug('start update calltimes by period');
            await this.stakeConnectionRunner.commitTransaction();
            this.logger.debug('commit success');
            this.utilsService.updateRecordHeight(this.heightConfigFile, Number(blockList.result[blockList.result.length - 1].height));
            (0, utils_service_1.writeSucessExcuteLog)(const_1.config.get('STAKE.MONITOR_PATH'));
        }
        catch (e) {
            console.error(e.message);
            this.logger.error(e.message);
            this.logger.error('rollback');
            await this.stakeConnectionRunner.rollbackTransaction();
            (0, utils_service_1.writeFailExcuteLog)(const_1.config.get('STAKE.MONITOR_PATH'));
        }
        finally {
            await this.stakeConnectionRunner.release();
            this.logger.debug('release success');
        }
    }
    async handleOrderCreatedEvent(block, latestFinalizedBlockHeight) {
        this.logger.debug(block.height + ' start insert');
        const height = Number(block.height);
        const timestamp = moment(moment(Number(block.timestamp) * 1000).format('YYYY-MM-DD HH:00:00')).unix();
        await this.updateCheckPoint(block);
        for (const transaction of block.transactions) {
            switch (transaction.type) {
                case enum_1.THETA_TRANSACTION_TYPE_ENUM.coinbase:
                    const transacitonToBeUpserted = [];
                    for (const output of transaction.raw.outputs) {
                        transacitonToBeUpserted.push({
                            reward_amount: Number(new bignumber_js_1.default(output.coins.tfuelwei).dividedBy('1e18').toFixed()),
                            wallet_address: output.address.toLocaleLowerCase(),
                            reward_height: height,
                            timestamp: Number(block.timestamp)
                        });
                        if (transacitonToBeUpserted.length > 900) {
                            await this.stakeConnectionRunner.manager.insert(stake_reward_entity_1.StakeRewardEntity, transacitonToBeUpserted);
                            transacitonToBeUpserted.length = 0;
                        }
                    }
                    await this.stakeConnectionRunner.manager.insert(stake_reward_entity_1.StakeRewardEntity, transacitonToBeUpserted);
                    this.logger.debug(height + ' end upsert stake reward');
                    break;
                default:
                    break;
            }
        }
        this.logger.debug(height + ' end update analyse');
        this.counter--;
    }
    async updateCheckPoint(block) {
        try {
            if (Number(block.height) % 100 !== 1) {
                this.logger.debug(block.height + ': not checkpoint block');
                return;
            }
            this.logger.debug(block.height + ' start update check point');
            const vaRes = await this.updateValidator(block);
            if (!vaRes)
                return;
            const [vaTotalNodeNum, vaEffectiveNodeNum, vaTotalThetaWei, vaEffectiveThetaWei] = vaRes;
            const gnRes = await this.updateGuardian(block);
            if (!gnRes)
                return;
            const [guTotalNodeNum, guEffectiveNodeNum, guTotalThetaWei, guEffectiveThetaWei] = gnRes;
            const eenpRes = await this.updateEenp(block);
            if (!eenpRes)
                return;
            const [eenpTotalNodeNum, eenpEffectiveNodeNum, eenpTotalTfWei, eenpEffectiveTfWei] = eenpRes;
            let res = await this.stakeConnectionRunner.manager.findOne(stake_statistics_entity_1.StakeStatisticsEntity, {
                where: { block_height: Number(block.height) }
            });
            if (!res) {
                const stakeStatisticsInfo = {
                    block_height: Number(block.height),
                    total_elite_edge_node_number: eenpTotalNodeNum,
                    effective_elite_edge_node_number: eenpEffectiveNodeNum,
                    total_edge_node_stake_amount: parseInt(eenpTotalTfWei.dividedBy('1e18').toFixed()),
                    effective_elite_edge_node_stake_amount: parseInt(eenpEffectiveTfWei.dividedBy('1e18').toFixed()),
                    theta_fuel_stake_ratio: Number(eenpTotalTfWei.dividedBy('5.399646029e27').toFixed()),
                    timestamp: Number(block.timestamp),
                    total_guardian_node_number: guTotalNodeNum,
                    effective_guardian_node_number: guEffectiveNodeNum,
                    total_guardian_stake_amount: parseInt(guTotalThetaWei.dividedBy('1e18').toFixed()),
                    effective_guardian_stake_amount: Number(guEffectiveThetaWei.dividedBy('1e18').toFixed()),
                    theta_stake_ratio: Number(guTotalThetaWei.plus(vaTotalThetaWei).dividedBy('1e27').toFixed()),
                    total_validator_node_number: vaTotalNodeNum,
                    effective_validator_node_number: vaEffectiveNodeNum,
                    effective_validator_stake_amount: parseInt(vaEffectiveThetaWei.dividedBy('1e18').toFixed()),
                    total_validator_stake_amount: parseInt(vaTotalThetaWei.dividedBy('1e18').toFixed())
                };
                this.logger.debug('insert stake statistics info', JSON.stringify(stakeStatisticsInfo));
                try {
                    return await this.stakeConnectionRunner.manager.insert(stake_statistics_entity_1.StakeStatisticsEntity, stakeStatisticsInfo);
                }
                catch (e) {
                    this.logger.error('insert stake statistics error:' + JSON.stringify(e));
                }
            }
        }
        catch (e) {
            this.logger.error('updateCheckPoint error:' + JSON.stringify(e));
        }
    }
    async updateValidator(block) {
        let totalNodeNum = 0, effectiveNodeNum = 0, totalThetaWei = new bignumber_js_1.default(0), effectiveThetaWei = new bignumber_js_1.default(0);
        this.logger.debug('start get va list');
        const validatorList = await theta_ts_sdk_1.thetaTsSdk.blockchain.getVcpByHeight(block.height);
        this.logger.debug('end get va list');
        if (!validatorList.result || !validatorList.result.BlockHashVcpPairs) {
            this.logger.error('no validator BlockHashVcpPairs');
            return false;
        }
        const latestVa = await this.stakeConnectionRunner.manager.findOne(latest_stake_info_entity_1.LatestStakeInfoEntity, {
            where: { node_type: stake_entity_1.STAKE_NODE_TYPE_ENUM.validator }
        });
        if (!latestVa) {
            await this.stakeConnectionRunner.manager.insert(latest_stake_info_entity_1.LatestStakeInfoEntity, {
                height: Number(block.height),
                node_type: stake_entity_1.STAKE_NODE_TYPE_ENUM.validator,
                holder: JSON.stringify(validatorList)
            });
        }
        else {
            await this.stakeConnectionRunner.manager.update(latest_stake_info_entity_1.LatestStakeInfoEntity, {
                node_type: stake_entity_1.STAKE_NODE_TYPE_ENUM.validator
            }, {
                height: Number(block.height),
                node_type: stake_entity_1.STAKE_NODE_TYPE_ENUM.validator,
                holder: JSON.stringify(validatorList)
            });
        }
        validatorList.result.BlockHashVcpPairs[0].Vcp.SortedCandidates.forEach((node) => {
            totalNodeNum++;
            node.Stakes.forEach((stake) => {
                totalThetaWei = totalThetaWei.plus(new bignumber_js_1.default(stake.amount));
                block.hcc.Votes.forEach((vote) => {
                    if (vote.ID === node.Holder && !stake.withdrawn) {
                        effectiveNodeNum++;
                        effectiveThetaWei = effectiveThetaWei.plus(new bignumber_js_1.default(stake.amount));
                    }
                });
            });
        });
        return [totalNodeNum, effectiveNodeNum, totalThetaWei, effectiveThetaWei];
    }
    async updateGuardian(block) {
        let totalNodeNum = 0, effectiveNodeNum = 0, totalThetaWei = new bignumber_js_1.default(0), effectiveThetaWei = new bignumber_js_1.default(0);
        this.logger.debug('start get gn list');
        const gcpList = await theta_ts_sdk_1.thetaTsSdk.blockchain.getGcpByHeight(block.height);
        this.logger.debug('end get gn list');
        if (!gcpList.result || !gcpList.result.BlockHashGcpPairs) {
            this.logger.error('no guardian BlockHashVcpPairs');
            return false;
        }
        const latestGn = await this.stakeConnectionRunner.manager.findOne(latest_stake_info_entity_1.LatestStakeInfoEntity, {
            where: { node_type: stake_entity_1.STAKE_NODE_TYPE_ENUM.guardian }
        });
        if (!latestGn) {
            await this.stakeConnectionRunner.manager.insert(latest_stake_info_entity_1.LatestStakeInfoEntity, {
                height: Number(block.height),
                node_type: stake_entity_1.STAKE_NODE_TYPE_ENUM.guardian,
                holder: JSON.stringify(gcpList)
            });
        }
        else {
            await this.stakeConnectionRunner.manager.update(latest_stake_info_entity_1.LatestStakeInfoEntity, { node_type: stake_entity_1.STAKE_NODE_TYPE_ENUM.guardian }, {
                height: Number(block.height),
                node_type: stake_entity_1.STAKE_NODE_TYPE_ENUM.guardian,
                holder: JSON.stringify(gcpList)
            });
        }
        for (const guardian of gcpList.result.BlockHashGcpPairs[0].Gcp.SortedGuardians) {
            totalNodeNum++;
            guardian.Stakes.forEach((stake) => {
                totalThetaWei = totalThetaWei.plus(new bignumber_js_1.default(stake.amount));
            });
        }
        for (let i = 0; i < block.guardian_votes.Multiplies.length; i++) {
            if (block.guardian_votes.Multiplies[i] !== 0) {
                gcpList.result.BlockHashGcpPairs[0].Gcp.SortedGuardians[i].Stakes.forEach((stake) => {
                    if (stake.withdrawn == false) {
                        effectiveThetaWei = effectiveThetaWei.plus(new bignumber_js_1.default(stake.amount));
                    }
                });
                effectiveNodeNum++;
            }
        }
        this.logger.debug('end gn analyse');
        return [totalNodeNum, effectiveNodeNum, totalThetaWei, effectiveThetaWei];
    }
    async updateEenp(block) {
        let totalNodeNum = 0, effectiveNodeNum = 0, totalTfuelWei = new bignumber_js_1.default(0), effectiveTfuelWei = new bignumber_js_1.default(0);
        this.logger.debug('start get een list');
        const eenpList = await theta_ts_sdk_1.thetaTsSdk.blockchain.getEenpByHeight(block.height);
        this.logger.debug('end get een list');
        if (!eenpList.result || !eenpList.result.BlockHashEenpPairs) {
            this.logger.error('no guardian BlockHashVcpPairs');
            return false;
        }
        const een = await this.stakeConnectionRunner.manager.findOne(latest_stake_info_entity_1.LatestStakeInfoEntity, {
            where: { node_type: stake_entity_1.STAKE_NODE_TYPE_ENUM.edge_cache }
        });
        if (!een) {
            await this.stakeConnectionRunner.manager.insert(latest_stake_info_entity_1.LatestStakeInfoEntity, {
                height: Number(block.height),
                node_type: stake_entity_1.STAKE_NODE_TYPE_ENUM.edge_cache,
                holder: JSON.stringify(eenpList)
            });
        }
        else {
            await this.stakeConnectionRunner.manager.update(latest_stake_info_entity_1.LatestStakeInfoEntity, { node_type: stake_entity_1.STAKE_NODE_TYPE_ENUM.edge_cache }, {
                height: Number(block.height),
                node_type: stake_entity_1.STAKE_NODE_TYPE_ENUM.edge_cache,
                holder: JSON.stringify(eenpList)
            });
        }
        eenpList.result.BlockHashEenpPairs[0].EENs.forEach((eenp) => {
            totalNodeNum++;
            let isEffectiveNode = false;
            block.elite_edge_node_votes.Multiplies.forEach((value, index) => {
                if (block.elite_edge_node_votes.Addresses[index] == eenp.Holder && value !== 0) {
                    isEffectiveNode = true;
                    effectiveNodeNum++;
                }
            });
            eenp.Stakes.forEach((stake) => {
                totalTfuelWei = totalTfuelWei.plus(new bignumber_js_1.default(stake.amount));
                if (isEffectiveNode && !stake.withdrawn) {
                    effectiveTfuelWei = effectiveTfuelWei.plus(new bignumber_js_1.default(stake.amount));
                }
            });
        });
        return [totalNodeNum, effectiveNodeNum, totalTfuelWei, effectiveTfuelWei];
    }
};
StakeAnalyseService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_2.InjectConnection)('stake')),
    __metadata("design:paramtypes", [utils_service_1.UtilsService,
        typeorm_1.Connection])
], StakeAnalyseService);
exports.StakeAnalyseService = StakeAnalyseService;
//# sourceMappingURL=stake-analyse.service.js.map