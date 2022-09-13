"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyseBootstrap = void 0;
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const tx_analyse_service_1 = require("./block-chain/tx/tx-analyse.service");
const tx_module_1 = require("./block-chain/tx/tx.module");
async function analyseBootstrap() {
    let i = 0;
    while (1) {
        const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
        const tx = app.select(tx_module_1.TxModule).get(tx_analyse_service_1.TxAnalyseService, { strict: true });
        await tx.analyseData();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        app.close();
        i++;
    }
}
exports.analyseBootstrap = analyseBootstrap;
//# sourceMappingURL=analyse.js.map