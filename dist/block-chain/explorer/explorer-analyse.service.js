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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplorerAnalyseService = void 0;
const const_1 = require("./const");
const count_entity_1 = require("./count.entity");
const transaction_entity_1 = require("./transaction.entity");
const block_list_entity_1 = require("./block-list.entity");
const utils_service_1 = require("../../common/utils.service");
const typeorm_1 = require("typeorm");
const common_1 = require("@nestjs/common");
const theta_ts_sdk_1 = require("theta-ts-sdk");
const bignumber_js_1 = require("bignumber.js");
const enum_1 = require("theta-ts-sdk/dist/types/enum");
const config = require('config');
const path = require('path');
let ExplorerAnalyseService = class ExplorerAnalyseService {
    constructor(utilsService) {
        this.utilsService = utilsService;
        this.logger = new common_1.Logger('explorer analyse service');
        this.heightConfigFile = config.get('ORM_CONFIG')['database'] + 'explorer/record.height';
        this.current = {};
        this.transactionNum = 0;
    }
    async getInitHeight(configPath) {
        let height = 0;
        this.logger.debug(this.heightConfigFile);
        const lastfinalizedHeight = Number((await theta_ts_sdk_1.thetaTsSdk.blockchain.getStatus()).result.latest_finalized_block_height);
        this.logger.debug(JSON.stringify(config.get(configPath.toUpperCase() + '.START_HEIGHT')));
        if (config.get(configPath.toUpperCase() + '.START_HEIGHT')) {
            height = config.get(configPath.toUpperCase() + '.START_HEIGHT');
        }
        const recordHeight = this.utilsService.getRecordHeight(this.heightConfigFile);
        height = recordHeight > height ? recordHeight : height;
        if (height >= lastfinalizedHeight) {
            this.logger.debug('commit success');
            this.logger.debug('no height to analyse');
            return [0, 0];
        }
        let endHeight = lastfinalizedHeight;
        const analyseNumber = config.get(configPath.toUpperCase() + '.ANALYSE_NUMBER');
        if (lastfinalizedHeight - height > analyseNumber) {
            endHeight = height + analyseNumber;
        }
        return [height, endHeight];
    }
    async analyseData() {
        try {
            this.explorerConnection = (0, typeorm_1.getConnection)('explorer').createQueryRunner();
            await this.explorerConnection.connect();
            await this.explorerConnection.startTransaction();
            this.transactionNum = 0;
            const [startHeight, endHeight] = await this.getInitHeight('explorer');
            if (endHeight == 0) {
                await this.explorerConnection.commitTransaction();
                await this.explorerConnection.release();
                return;
            }
            this.logger.debug('start analyse data, start height:' + startHeight + ', end height:' + endHeight);
            const blockList = await theta_ts_sdk_1.thetaTsSdk.blockchain.getBlockSByRange(startHeight.toString(), endHeight.toString());
            this.logger.debug('get block list length:' + blockList.result.length);
            for (const block of blockList.result) {
                await this.handleData(block);
            }
            const tansactionCountEntity = await this.explorerConnection.manager.findOne(count_entity_1.CountEntity, {
                key: const_1.TRANSACTION_COUNT_KEY
            });
            if (tansactionCountEntity) {
                tansactionCountEntity.count += this.transactionNum;
                await this.explorerConnection.manager.save(tansactionCountEntity);
            }
            else {
                await this.explorerConnection.manager.insert(count_entity_1.CountEntity, {
                    key: const_1.TRANSACTION_COUNT_KEY,
                    count: this.transactionNum
                });
            }
            const blockCountEntity = await this.explorerConnection.manager.findOne(count_entity_1.CountEntity, {
                key: const_1.BLOCK_COUNT_KEY
            });
            if (blockCountEntity) {
                blockCountEntity.count += blockList.result.length;
                await this.explorerConnection.manager.save(blockCountEntity);
            }
            else {
                await this.explorerConnection.manager.insert(count_entity_1.CountEntity, {
                    key: const_1.BLOCK_COUNT_KEY,
                    count: blockList.result.length
                });
            }
            if (blockList.result.length > 0) {
                this.utilsService.updateRecordHeight(this.heightConfigFile, Number(blockList.result[blockList.result.length - 1].height));
            }
            await this.explorerConnection.commitTransaction();
        }
        catch (e) {
            this.logger.error(e);
            console.error(e);
            this.logger.debug(JSON.stringify(this.current));
            await this.explorerConnection.rollbackTransaction();
            await this.explorerConnection.release();
            (0, utils_service_1.writeFailExcuteLog)(config.get('EXPLORER.MONITOR_PATH'));
        }
        finally {
            await this.explorerConnection.release();
            (0, utils_service_1.writeSucessExcuteLog)(config.get('EXPLORER.MONITOR_PATH'));
        }
    }
    async handleData(block) {
        const tfuelBurnt = block.transactions.reduce((acc, cur) => {
            if (cur.raw.fee && cur.raw.fee.tfuelwei)
                return acc + new bignumber_js_1.default(cur.raw.fee.tfuelwei).dividedBy('1e18').toNumber();
            else
                return acc;
        }, 0);
        this.logger.debug(block.height);
        for (const transaction of block.transactions) {
            this.current = transaction;
            let theta = 0, thetaFuel = 0, from = '', to = '';
            switch (transaction.type) {
                case enum_1.THETA_TRANSACTION_TYPE_ENUM.send:
                    if (transaction.raw.inputs.length > 0) {
                        theta = transaction.raw.inputs.reduce((curr, item) => {
                            return curr + new bignumber_js_1.default(item.coins.thetawei).dividedBy('1e18').toNumber();
                        }, 0);
                        thetaFuel = transaction.raw.inputs.reduce((curr, item) => {
                            return curr + new bignumber_js_1.default(item.coins.tfuelwei).dividedBy('1e18').toNumber();
                        }, 0);
                        from = JSON.stringify(transaction.raw.inputs);
                        to = JSON.stringify(transaction.raw.outputs);
                    }
                    else {
                        theta = new bignumber_js_1.default(transaction.raw.from.coins.thetawei).dividedBy('1e18').toNumber();
                        thetaFuel = new bignumber_js_1.default(transaction.raw.from.coins.tfuelwei)
                            .dividedBy('1e18')
                            .toNumber();
                        from = JSON.stringify([transaction.raw.from]);
                        to = JSON.stringify([transaction.raw.to]);
                    }
                    break;
                case enum_1.THETA_TRANSACTION_TYPE_ENUM.smart_contract:
                    from = transaction.raw.from.address;
                    to = transaction.raw.to.address;
                    break;
                case enum_1.THETA_TRANSACTION_TYPE_ENUM.coinbase:
                    from = transaction.raw.proposer.address;
                    break;
                case enum_1.THETA_TRANSACTION_TYPE_ENUM.service_payment:
                    from = transaction.raw.source.address;
                    to = transaction.raw.target.address;
                    break;
                case enum_1.THETA_TRANSACTION_TYPE_ENUM.reserve_fund:
                    from = transaction.raw.source.address;
                    break;
                case enum_1.THETA_TRANSACTION_TYPE_ENUM.split_rule:
                    from = transaction.raw.initiator.address;
                    break;
                case 11:
                    from = transaction.raw.holder.address;
                    break;
                default:
                    if (transaction.raw.from)
                        from = transaction.raw.from.address;
                    else {
                        from = transaction.raw.source.address;
                    }
                    break;
            }
            const gasPrice = transaction.raw.gas_price;
            const gasLimit = transaction.raw.gas_limit;
            if (config.get('CONFLICT_TRANSACTIONS').indexOf(transaction.hash) !== -1) {
                continue;
            }
            else {
                await this.explorerConnection.manager.insert(transaction_entity_1.TransactionEntity, {
                    tx_hash: transaction.hash,
                    height: Number(block.height),
                    fee: JSON.stringify(transaction.raw.fee),
                    tx_type: transaction.type,
                    from: from,
                    to: to,
                    timestamp: Number(block.timestamp),
                    theta: theta,
                    theta_fuel: thetaFuel,
                    gas_price: gasPrice,
                    gas_limit: gasLimit
                });
            }
        }
        this.transactionNum += block.transactions.length;
        return await this.explorerConnection.manager.insert(block_list_entity_1.BlokcListEntity, {
            height: Number(block.height),
            block_hash: block.hash,
            timestamp: Number(block.timestamp),
            tfuel_burnt: tfuelBurnt,
            txns: block.transactions.length
        });
    }
};
ExplorerAnalyseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [utils_service_1.UtilsService])
], ExplorerAnalyseService);
exports.ExplorerAnalyseService = ExplorerAnalyseService;
//# sourceMappingURL=explorer-analyse.service.js.map