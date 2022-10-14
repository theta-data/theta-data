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
exports.WalletTxHistoryService = void 0;
const transaction_entity_1 = require("./../explorer/transaction.entity");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wallet_tx_history_entity_1 = require("./wallet-tx-history.entity");
let WalletTxHistoryService = class WalletTxHistoryService {
    constructor(walletTxHistoryRepository, transactionRepository) {
        this.walletTxHistoryRepository = walletTxHistoryRepository;
        this.transactionRepository = transactionRepository;
    }
    async getTransactions(wallet, take = 10, skip = 0, txType) {
        const res = await this.walletTxHistoryRepository.findOne({
            where: { wallet: wallet }
        });
        if (!res) {
            return [false, 0, []];
        }
        const txs = JSON.parse(res.tx_ids);
        if (txs.length === 0) {
            return [false, 0, []];
        }
        const idsTyped = [];
        for (let i = 0; i < txs.length; i++) {
            if (txType == undefined || parseInt(txs[i].substring(txs[i].length - 1), 36) == txType) {
                idsTyped.push(parseInt(txs[i].substring(0, txs[i].length - 1), 36));
            }
        }
        if (skip > idsTyped.length) {
            return [false, 0, []];
        }
        const hasNextPage = idsTyped.length > skip + take ? true : false;
        let idsToFind = [];
        if (skip == 0) {
            idsToFind = idsTyped.slice(-take);
        }
        else {
            idsToFind = idsTyped.slice(-skip - take, -skip);
        }
        const list = await this.transactionRepository.find({
            where: { id: (0, typeorm_2.In)(idsToFind) },
            order: { height: 'DESC' }
        });
        return [hasNextPage, idsTyped.length, list];
    }
};
WalletTxHistoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wallet_tx_history_entity_1.WalletTxHistoryEntity, 'wallet-tx-history')),
    __param(1, (0, typeorm_1.InjectRepository)(transaction_entity_1.TransactionEntity, 'explorer')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], WalletTxHistoryService);
exports.WalletTxHistoryService = WalletTxHistoryService;
//# sourceMappingURL=wallet-tx-history.service.js.map