"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyseBootstrap = void 0;
const wallet_tx_history_module_1 = require("./block-chain/wallet-tx-history/wallet-tx-history.module");
const stake_analyse_service_1 = require("./block-chain/stake/stake-analyse.service");
const stake_module_1 = require("./block-chain/stake/stake.module");
const wallets_analyse_service_1 = require("./block-chain/wallet/wallets-analyse.service");
const smart_contract_analyse_service_1 = require("./block-chain/smart-contract/smart-contract-analyse.service");
const smart_contract_module_1 = require("./block-chain/smart-contract/smart-contract.module");
const nft_analyse_service_1 = require("./block-chain/smart-contract/nft/nft-analyse.service");
const nft_module_1 = require("./block-chain/smart-contract/nft/nft.module");
const nft_statistics_analyse_service_1 = require("./statistics/nft/nft-statistics-analyse.service");
const nft_statistics_module_1 = require("./statistics/nft/nft-statistics.module");
const explorer_analyse_service_1 = require("./block-chain/explorer/explorer-analyse.service");
const explorer_module_1 = require("./block-chain/explorer/explorer.module");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const tx_analyse_service_1 = require("./block-chain/tx/tx-analyse.service");
const tx_module_1 = require("./block-chain/tx/tx.module");
const wallet_module_1 = require("./block-chain/wallet/wallet.module");
const wallet_tx_history_analyse_service_1 = require("./block-chain/wallet-tx-history/wallet-tx-history-analyse.service");
async function analyseBootstrap() {
    let i = 0;
    while (1) {
        const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
        const tx = app.select(tx_module_1.TxModule).get(tx_analyse_service_1.TxAnalyseService, { strict: true });
        const explorer = app.select(explorer_module_1.ExplorerModule).get(explorer_analyse_service_1.ExplorerAnalyseService, { strict: true });
        const smartContract = app
            .select(smart_contract_module_1.SmartContractModule)
            .get(smart_contract_analyse_service_1.SmartContractAnalyseService, { strict: true });
        const nft = app.select(nft_module_1.NftModule).get(nft_analyse_service_1.NftAnalyseService, { strict: true });
        const nftStatistics = app
            .select(nft_statistics_module_1.NftStatisticsModule)
            .get(nft_statistics_analyse_service_1.NftStatisticsAnalyseService, { strict: true });
        const wallet = app.select(wallet_module_1.WalletModule).get(wallets_analyse_service_1.WalletsAnalyseService, { strict: true });
        const stake = app.select(stake_module_1.StakeModule).get(stake_analyse_service_1.StakeAnalyseService, { strict: true });
        const walletTxHistory = app
            .select(wallet_tx_history_module_1.WalletTxHistoryModule)
            .get(wallet_tx_history_analyse_service_1.WalletTxHistoryAnalyseService, { strict: true });
        await tx.analyseData();
        await smartContract.analyseData();
        await explorer.analyseData();
        await wallet.analyseData();
        await stake.analyseData();
        await nft.analyseData(i);
        await nftStatistics.analyseData();
        await walletTxHistory.analyseData();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        app.close();
        i++;
    }
}
exports.analyseBootstrap = analyseBootstrap;
//# sourceMappingURL=analyse.js.map