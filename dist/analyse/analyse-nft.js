"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_service_1 = require("../common/utils.service");
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const nft_analyse_service_1 = require("../block-chain/smart-contract/nft/nft-analyse.service");
const nft_module_1 = require("../block-chain/smart-contract/nft/nft.module");
const config = require('config');
async function bootstrap() {
    let i = 0;
    try {
        while (1) {
            const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
            const service = app.select(nft_module_1.NftModule).get(nft_analyse_service_1.NftAnalyseService, { strict: true });
            await Promise.race([
                service.analyseData(i),
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve('timeout');
                        console.log('analyse race timeout');
                    }, 1000 * 60 * 5);
                })
            ]);
            await new Promise((resolve) => setTimeout(resolve, config.get('NFT.ANALYSE_INTERVAL')));
            app.close();
            i++;
        }
    }
    catch (e) {
        console.log('analyse-nft catch error');
        console.log(e);
        (0, utils_service_1.writeFailExcuteLog)(config.get('NFT.MONITOR_PATH'));
        process.exit();
    }
}
bootstrap();
//# sourceMappingURL=analyse-nft.js.map