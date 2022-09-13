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
exports.SmartContractAnalyseService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const enum_1 = require("theta-ts-sdk/dist/types/enum");
const theta_ts_sdk_1 = require("theta-ts-sdk");
const logger_service_1 = require("../../common/logger.service");
const smart_contract_call_record_entity_1 = require("./smart-contract-call-record.entity");
const smart_contract_entity_1 = require("./smart-contract.entity");
const utils_service_1 = require("../../common/utils.service");
const smart_contract_service_1 = require("./smart-contract.service");
const cross_fetch_1 = require("cross-fetch");
const config = require('config');
const moment = require('moment');
const fs = require('fs');
let SmartContractAnalyseService = class SmartContractAnalyseService {
    constructor(loggerService, utilsService, smartContractService) {
        this.loggerService = loggerService;
        this.utilsService = utilsService;
        this.smartContractService = smartContractService;
        this.logger = new common_1.Logger('smart contract analyse service');
        this.analyseKey = 'under_analyse';
        this.counter = 0;
        this.startTimestamp = 0;
        this.heightConfigFile = config.get('ORM_CONFIG')['database'] + 'smart_contract/record.height';
        this.smartContractList = [];
        this.logger.debug(config.get('SMART_CONTRACT.THETA_NODE_HOST'));
    }
    async analyseData() {
        try {
            this.smartContractConnection = (0, typeorm_1.getConnection)('smart_contract').createQueryRunner();
            await this.smartContractConnection.connect();
            await this.smartContractConnection.startTransaction();
            let height = 0;
            const lastfinalizedHeight = Number((await theta_ts_sdk_1.thetaTsSdk.blockchain.getStatus()).result.latest_finalized_block_height);
            height = lastfinalizedHeight - 1000;
            if (config.get('SMART_CONTRACT.START_HEIGHT')) {
                height = config.get('SMART_CONTRACT.START_HEIGHT');
            }
            if (!fs.existsSync(this.heightConfigFile)) {
                this.logger.debug('read height');
                this.logger.debug('finish mkdir');
                fs.writeFileSync(this.heightConfigFile, '0');
            }
            else {
                const data = fs.readFileSync(this.heightConfigFile, 'utf8');
                if (data && Number(data) > height) {
                    height = Number(data) + 1;
                }
            }
            const latestRecord = await this.smartContractConnection.manager.findOne(smart_contract_call_record_entity_1.SmartContractCallRecordEntity, {
                order: {
                    height: 'DESC'
                }
            });
            const latestRecordHeight = latestRecord ? latestRecord.height : 0;
            if (latestRecordHeight >= height) {
                height = latestRecordHeight + 1;
            }
            if (height >= lastfinalizedHeight) {
                await this.smartContractConnection.commitTransaction();
                this.logger.debug('commit success');
                this.logger.debug('no height to analyse');
                return;
            }
            let endHeight = lastfinalizedHeight;
            const analyseNumber = config.get('SMART_CONTRACT.ANALYSE_NUMBER');
            if (lastfinalizedHeight - height > analyseNumber) {
                endHeight = height + analyseNumber;
            }
            this.logger.debug('start height: ' + height + '; end height: ' + endHeight);
            this.startTimestamp = moment().unix();
            const blockList = await theta_ts_sdk_1.thetaTsSdk.blockchain.getBlockSByRange(height.toString(), endHeight.toString());
            this.logger.debug('block list length:' + blockList.result.length);
            this.counter = blockList.result.length;
            this.logger.debug('init counter', this.counter);
            this.smartContractList = [];
            for (let i = 0; i < blockList.result.length; i++) {
                const block = blockList.result[i];
                this.logger.debug(block.height + ' start hanldle');
                await this.handleOrderCreatedEvent(block, lastfinalizedHeight);
            }
            await this.clearCallTimeByPeriod();
            for (const contract of this.smartContractList) {
                await this.updateCallTimesByPeriod(contract);
            }
            await this.smartContractConnection.commitTransaction();
            if (blockList.result.length > 1) {
                this.utilsService.updateRecordHeight(this.heightConfigFile, Number(blockList.result[blockList.result.length - 1].height));
            }
        }
        catch (e) {
            console.error(e.message);
            this.logger.error(e.message);
            this.logger.error('rollback');
            await this.smartContractConnection.rollbackTransaction();
            (0, utils_service_1.writeFailExcuteLog)(config.get('SMART_CONTRACT.MONITOR_PATH'));
        }
        finally {
            await this.smartContractConnection.release();
            this.logger.debug('release success');
            (0, utils_service_1.writeSucessExcuteLog)(config.get('SMART_CONTRACT.MONITOR_PATH'));
        }
    }
    async handleOrderCreatedEvent(block, latestFinalizedBlockHeight) {
        this.logger.debug(block.height + ' start insert');
        const height = Number(block.height);
        for (const transaction of block.transactions) {
            switch (transaction.type) {
                case enum_1.THETA_TRANSACTION_TYPE_ENUM.smart_contract:
                    await this.smartContractConnection.query(`INSERT INTO smart_contract_entity(contract_address,height,call_times_update_timestamp) VALUES ('${transaction.receipt.ContractAddress}',${height},${moment().unix()})  ON CONFLICT (contract_address) DO UPDATE set call_times=call_times+1,call_times_update_timestamp=${moment().unix()};`);
                    if (this.smartContractList.indexOf(transaction.receipt.ContractAddress) == -1) {
                        this.smartContractList.push(transaction.receipt.ContractAddress);
                    }
                    const smartContract = await this.smartContractConnection.manager.findOne(smart_contract_entity_1.SmartContractEntity, {
                        contract_address: transaction.receipt.ContractAddress
                    });
                    if (smartContract.call_times > config.get('SMART_CONTRACT_VERIFY_DETECT_TIMES') &&
                        !smartContract.verified &&
                        moment().unix() - smartContract.verification_check_timestamp > 3600 * 24 * 30) {
                        const checkInfo = await this.verifyWithThetaExplorer(smartContract.contract_address);
                        if (checkInfo) {
                            Object.assign(smartContract, checkInfo);
                            smartContract.verification_check_timestamp = moment().unix();
                        }
                        else {
                            smartContract.verification_check_timestamp = moment().unix();
                        }
                        await this.smartContractConnection.manager.save(smart_contract_entity_1.SmartContractEntity, smartContract);
                    }
                    if (config.get('CONFLICT_TRANSACTIONS').indexOf(transaction.hash) !== -1)
                        break;
                    await this.smartContractConnection.manager.insert(smart_contract_call_record_entity_1.SmartContractCallRecordEntity, {
                        timestamp: Number(block.timestamp),
                        data: transaction.raw.data,
                        receipt: JSON.stringify(transaction.receipt),
                        height: height,
                        transaction_hash: transaction.hash,
                        contract_id: smartContract.id
                    });
                    break;
            }
        }
        this.logger.debug(height + ' end update analyse');
        this.counter--;
        this.loggerService.timeMonitor('counter:' + this.counter, this.startTimestamp);
    }
    async verifyWithThetaExplorer(address) {
        this.logger.debug('start verify: ' + address);
        const httpRes = await (0, cross_fetch_1.default)('https://explorer.thetatoken.org:8443/api/smartcontract/' + address, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (httpRes.status >= 400) {
            this.logger.error('Get smart contract ' + address + ': Bad response from server');
            return false;
        }
        const res = await httpRes.json();
        if (res.body.verification_date == '')
            return false;
        const optimizer = res.body.optimizer === 'disabled' ? false : true;
        const optimizerRuns = res.body.optimizerRuns ? res.body.optimizerRuns : 200;
        const sourceCode = res.body.source_code;
        const version = res.body.compiler_version.match(/[\d,\.]+/g)[0];
        const versionFullName = 'soljson-' + res.body.compiler_version + '.js';
        const byteCode = res.body.bytecode;
        address = this.utilsService.normalize(address.toLowerCase());
        return this.smartContractService.getVerifyInfo(address, sourceCode, byteCode, version, versionFullName, optimizer, optimizerRuns);
    }
    async updateCallTimesByPeriod(contractAddress) {
        this.logger.debug('start update call times by period');
        const contract = await this.smartContractConnection.manager.findOne(smart_contract_entity_1.SmartContractEntity, {
            contract_address: contractAddress
        });
        contract.last_24h_call_times = await this.smartContractConnection.manager.count(smart_contract_call_record_entity_1.SmartContractCallRecordEntity, {
            timestamp: (0, typeorm_1.MoreThan)(moment().subtract(24, 'hours').unix()),
            contract_id: contract.id
        });
        contract.last_seven_days_call_times = await this.smartContractConnection.manager.count(smart_contract_call_record_entity_1.SmartContractCallRecordEntity, {
            timestamp: (0, typeorm_1.MoreThan)(moment().subtract(7, 'days').unix()),
            contract_id: contract.id
        });
        await this.smartContractConnection.manager.save(contract);
        this.logger.debug('end update call times by period');
    }
    async clearCallTimeByPeriod() {
        await this.smartContractConnection.manager.update(smart_contract_entity_1.SmartContractEntity, {
            call_times_update_timestamp: (0, typeorm_1.LessThan)(moment().subtract(24, 'hours').unix())
        }, { last_24h_call_times: 0 });
        await this.smartContractConnection.manager.update(smart_contract_entity_1.SmartContractEntity, {
            call_times_update_timestamp: (0, typeorm_1.LessThan)(moment().subtract(7, 'days').unix())
        }, { last_seven_days_call_times: 0 });
    }
};
SmartContractAnalyseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService,
        utils_service_1.UtilsService,
        smart_contract_service_1.SmartContractService])
], SmartContractAnalyseService);
exports.SmartContractAnalyseService = SmartContractAnalyseService;
//# sourceMappingURL=smart-contract-analyse.service.js.map