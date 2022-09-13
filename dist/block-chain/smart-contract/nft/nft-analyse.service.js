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
exports.NftAnalyseService = void 0;
const nft_transfer_record_entity_1 = require("./nft-transfer-record.entity");
const nft_balance_entity_1 = require("./nft-balance.entity");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const smart_contract_call_record_entity_1 = require("../smart-contract-call-record.entity");
const nft_service_1 = require("./nft.service");
const utils_service_1 = require("../../../common/utils.service");
const config = require('config');
const fs = require('fs');
const cross_fetch_1 = require("cross-fetch");
let NftAnalyseService = class NftAnalyseService {
    constructor(nftService, utilsService) {
        this.nftService = nftService;
        this.utilsService = utilsService;
        this.logger = new common_1.Logger('nft analyse service');
        this.analyseKey = 'under_analyse';
        this.heightConfigFile = config.get('ORM_CONFIG')['database'] + 'nft/record.height';
    }
    async analyseData(loop) {
        try {
            this.logger.debug(loop + ' start analyse nft data');
            this.smartContractConnection = (0, typeorm_1.getConnection)('smart_contract').createQueryRunner();
            this.nftConnection = (0, typeorm_1.getConnection)('nft').createQueryRunner();
            await this.smartContractConnection.connect();
            await this.nftConnection.connect();
            await this.nftConnection.startTransaction();
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
            const contractRecordList = await this.smartContractConnection.manager.find(smart_contract_call_record_entity_1.SmartContractCallRecordEntity, {
                where: {
                    id: (0, typeorm_1.MoreThan)(startId)
                },
                take: config.get('NFT.ANALYSE_NUMBER'),
                order: { id: 'ASC' }
            });
            const promiseArr = [];
            for (const record of contractRecordList) {
                promiseArr.push(this.nftService.updateNftRecord(this.nftConnection, this.smartContractConnection, record));
                await Promise.all(promiseArr);
            }
            this.logger.debug('start update calltimes by period');
            if (config.get('NFT.DL_ALL_NFT_IMG') == true) {
                await this.downloadAllImg(loop);
            }
            await this.nftConnection.commitTransaction();
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
            await this.nftConnection.rollbackTransaction();
            (0, utils_service_1.writeFailExcuteLog)(config.get('NFT.MONITOR_PATH'));
        }
        finally {
            await this.nftConnection.release();
            (0, utils_service_1.writeSucessExcuteLog)(config.get('NFT.MONITOR_PATH'));
            this.logger.debug('end analyse nft data');
            this.logger.debug('release success');
        }
    }
    async downloadAllImg(loop) {
        const total = await this.nftConnection.manager.count(nft_balance_entity_1.NftBalanceEntity);
        const pageSize = 100;
        const pageCount = Math.ceil(total / pageSize);
        if (loop > pageCount) {
            this.logger.debug('loop ' + loop + ' page count:' + pageCount);
            return;
        }
        const list = await this.nftConnection.manager.find(nft_balance_entity_1.NftBalanceEntity, {
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
                const imgStorePath = await this.utilsService.getPath(detail.image, config.get('NFT.STATIC_PATH'));
                if (item.name == detail.name && item.img_uri == imgStorePath) {
                    this.logger.debug('img is ok');
                    continue;
                }
                item.name = detail.name;
                if (imgStorePath != item.img_uri) {
                    item.img_uri = detail.image;
                }
            }
            const imgPath = await this.utilsService.downloadImage(item.img_uri, config.get('NFT.STATIC_PATH'));
            this.logger.debug('loop ' + loop + ': ' + item.img_uri + ' ' + imgPath);
            item.img_uri = imgPath;
            await this.nftConnection.manager.save(item);
            await this.nftConnection.manager.update(nft_transfer_record_entity_1.NftTransferRecordEntity, {
                smart_contract_address: item.smart_contract_address,
                token_id: item.token_id
            }, { img_uri: imgPath, name: item.name });
        }
    }
};
NftAnalyseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nft_service_1.NftService, utils_service_1.UtilsService])
], NftAnalyseService);
exports.NftAnalyseService = NftAnalyseService;
//# sourceMappingURL=nft-analyse.service.js.map