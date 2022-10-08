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
exports.NftAnalyseService = void 0;
const nft_retrive_entity_1 = require("./nft-retrive.entity");
const smart_contract_entity_1 = require("../smart-contract.entity");
const nft_transfer_record_entity_1 = require("./nft-transfer-record.entity");
const nft_balance_entity_1 = require("./nft-balance.entity");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const smart_contract_call_record_entity_1 = require("../smart-contract-call-record.entity");
const nft_service_1 = require("./nft.service");
const utils_service_1 = require("../../../common/utils.service");
const fs = require('fs');
const cross_fetch_1 = require("cross-fetch");
const const_1 = require("../../../const");
const typeorm_2 = require("@nestjs/typeorm");
let NftAnalyseService = class NftAnalyseService {
    constructor(nftService, utilsService, smartContractConnectionInjected, nftConnectionInjected) {
        this.nftService = nftService;
        this.utilsService = utilsService;
        this.smartContractConnectionInjected = smartContractConnectionInjected;
        this.nftConnectionInjected = nftConnectionInjected;
        this.logger = new common_1.Logger('nft analyse service');
        this.analyseKey = 'under_analyse';
        this.heightConfigFile = const_1.config.get('ORM_CONFIG')['database'] + 'nft/record.height';
    }
    async analyseData(loop) {
        try {
            this.logger.debug(loop + ' start analyse nft data');
            console.log(const_1.config.get('NFT'));
            this.smartContractConnectionRunner = this.smartContractConnectionInjected.createQueryRunner();
            this.nftConnectionRunner = this.nftConnectionInjected.createQueryRunner();
            await this.nftConnectionRunner.startTransaction();
            let startId = 0;
            if (!fs.existsSync(this.heightConfigFile)) {
                fs.writeFileSync(this.heightConfigFile, '0');
            }
            else {
                const data = fs.readFileSync(this.heightConfigFile, 'utf8');
                if (data) {
                    startId = Number(data);
                }
            }
            const contractRecordList = await this.smartContractConnectionRunner.manager.find(smart_contract_call_record_entity_1.SmartContractCallRecordEntity, {
                where: {
                    id: (0, typeorm_1.MoreThan)(startId)
                },
                take: const_1.config.get('NFT.ANALYSE_NUMBER'),
                order: { id: 'ASC' }
            });
            const promiseArr = [];
            this.logger.debug('records length:' + contractRecordList.length);
            for (const record of contractRecordList) {
                await this.nftService.updateNftRecord(this.nftConnectionRunner, this.smartContractConnectionRunner, record);
            }
            await this.retriveNfts();
            this.logger.debug('start update calltimes by period');
            await this.nftConnectionRunner.commitTransaction();
            if (contractRecordList.length > 0) {
                this.logger.debug('end height:' + Number(contractRecordList[contractRecordList.length - 1].height));
                this.utilsService.updateRecordHeight(this.heightConfigFile, contractRecordList[contractRecordList.length - 1].id);
            }
            this.logger.debug('commit success');
        }
        catch (e) {
            console.error(e.message);
            this.logger.error(e.message);
            this.logger.error('rollback');
            await this.nftConnectionRunner.rollbackTransaction();
            (0, utils_service_1.writeFailExcuteLog)(const_1.config.get('NFT.MONITOR_PATH'));
        }
        finally {
            await this.nftConnectionRunner.release();
            (0, utils_service_1.writeSucessExcuteLog)(const_1.config.get('NFT.MONITOR_PATH'));
            this.logger.debug('end analyse nft data');
            this.logger.debug('release success');
        }
    }
    async downloadAllImg(loop) {
        const total = await this.nftConnectionRunner.manager.count(nft_balance_entity_1.NftBalanceEntity);
        const pageSize = 100;
        const pageCount = Math.ceil(total / pageSize);
        if (loop > pageCount) {
            this.logger.debug('loop ' + loop + ' page count:' + pageCount);
            return;
        }
        const list = await this.nftConnectionRunner.manager.find(nft_balance_entity_1.NftBalanceEntity, {
            skip: (loop + 2400) * pageSize,
            take: pageSize,
            order: {
                id: 'DESC'
            }
        });
        for (const item of list) {
            this.logger.debug('start download ' + item.img_uri);
            if (!item.detail) {
                try {
                    const res = await Promise.race([
                        async () => {
                            const httpRes = await (0, cross_fetch_1.default)(item.token_uri, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });
                            if (httpRes.status >= 400) {
                                throw new Error('Bad response from server');
                            }
                            const res = await httpRes.json();
                            item.detail = JSON.stringify(res);
                            item.name = res.name;
                            item.img_uri = res.image;
                            this.logger.debug('end get token uri ' + item.img_uri);
                        },
                        this.utilsService.timeout(5000)
                    ]);
                    console.log(res);
                }
                catch (e) {
                    this.logger.error(e);
                }
            }
            else {
                const detail = JSON.parse(item.detail);
                const imgStorePath = await this.utilsService.getPath(detail.image, const_1.config.get('NFT.STATIC_PATH'));
                if (item.name == detail.name && item.img_uri == imgStorePath) {
                    this.logger.debug('img is ok');
                    continue;
                }
                item.name = detail.name;
                if (imgStorePath != item.img_uri) {
                    item.img_uri = detail.image;
                }
            }
            const imgPath = await this.utilsService.downloadImage(item.img_uri, const_1.config.get('NFT.STATIC_PATH'));
            this.logger.debug('loop ' + loop + ': ' + item.img_uri + ' ' + imgPath);
            item.img_uri = imgPath;
            await this.nftConnectionRunner.manager.save(item);
            await this.nftConnectionRunner.manager.update(nft_transfer_record_entity_1.NftTransferRecordEntity, {
                smart_contract_address: item.smart_contract_address,
                token_id: item.token_id
            }, { img_uri: imgPath, name: item.name });
        }
    }
    async retriveNfts() {
        const moment = require('moment');
        const smartContracts = await this.smartContractConnectionRunner.manager.find(smart_contract_entity_1.SmartContractEntity, {
            where: {
                verification_date: (0, typeorm_1.MoreThan)(moment().subtract(1, 'days').unix())
            }
        });
        for (const contract of smartContracts) {
            const retrived = await this.nftConnectionRunner.manager.findOne(nft_retrive_entity_1.NftRetriveEntity, {
                where: {
                    smart_contract_address: contract.contract_address
                }
            });
            if (retrived) {
                continue;
            }
            const nftRecords = await this.smartContractConnectionRunner.manager.find(smart_contract_call_record_entity_1.SmartContractCallRecordEntity, {
                where: {
                    contract_id: contract.id,
                    timestamp: (0, typeorm_1.LessThan)(contract.verification_date + 10 * 60)
                }
            });
            for (const record of nftRecords) {
                await this.nftService.updateNftRecord(this.nftConnectionRunner, this.smartContractConnectionRunner, record);
            }
            const retrive = new nft_retrive_entity_1.NftRetriveEntity();
            retrive.smart_contract_address = contract.contract_address;
            retrive.retrived = true;
            await this.nftConnectionRunner.manager.save(retrive);
        }
    }
};
NftAnalyseService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_2.InjectConnection)('smart_contract')),
    __param(3, (0, typeorm_2.InjectConnection)('nft')),
    __metadata("design:paramtypes", [nft_service_1.NftService,
        utils_service_1.UtilsService,
        typeorm_1.Connection,
        typeorm_1.Connection])
], NftAnalyseService);
exports.NftAnalyseService = NftAnalyseService;
//# sourceMappingURL=nft-analyse.service.js.map