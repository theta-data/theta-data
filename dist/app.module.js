"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const wallet_tx_history_module_1 = require("./block-chain/wallet-tx-history/wallet-tx-history.module");
const explorer_module_1 = require("./block-chain/explorer/explorer.module");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const graphql_1 = require("@nestjs/graphql");
const tx_module_1 = require("./block-chain/tx/tx.module");
const schedule_1 = require("@nestjs/schedule");
const stake_module_1 = require("./block-chain/stake/stake.module");
const market_module_1 = require("./market/market.module");
const rpc_module_1 = require("./block-chain/rpc/rpc.module");
const smart_contract_module_1 = require("./block-chain/smart-contract/smart-contract.module");
const path_1 = require("path");
const serve_static_1 = require("@nestjs/serve-static");
const throttler_1 = require("@nestjs/throttler");
const wallet_module_1 = require("./block-chain/wallet/wallet.module");
const event_emitter_1 = require("@nestjs/event-emitter");
const contact_module_1 = require("./contact/contact.module");
const apollo_1 = require("@nestjs/apollo");
const core_1 = require("@nestjs/core");
const guard_1 = require("./guard");
const logger_module_1 = require("./logger/logger.module");
const logger_middleware_1 = require("./logger/logger.middleware");
const nft_statistics_module_1 = require("./statistics/nft/nft-statistics.module");
const config = require('config');
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(logger_middleware_1.LoggerMiddleware).forRoutes('*');
    }
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot(Object.assign(Object.assign({}, config.get('ORM_CONFIG')), { database: config.get('ORM_CONFIG')['database'] + 'contact.sqlite', name: 'contact', entities: [] })),
            typeorm_1.TypeOrmModule.forRoot(Object.assign(Object.assign({}, config.get('ORM_CONFIG')), { database: config.get('ORM_CONFIG')['database'] + 'analyse.sqlite', name: 'analyse', entities: [] })),
            typeorm_1.TypeOrmModule.forRoot(Object.assign(Object.assign({}, config.get('ORM_CONFIG')), { database: config.get('ORM_CONFIG')['database'] + 'smart_contract/smart_contract.sqlite', name: 'smart_contract', entities: [] })),
            typeorm_1.TypeOrmModule.forRoot(Object.assign(Object.assign({}, config.get('ORM_CONFIG')), { database: config.get('ORM_CONFIG')['database'] + 'nft/nft.sqlite', name: 'nft', entities: [] })),
            typeorm_1.TypeOrmModule.forRoot(Object.assign(Object.assign({}, config.get('ORM_CONFIG')), { database: config.get('ORM_CONFIG')['database'] + 'stake/stake.sqlite', name: 'stake', entities: [] })),
            typeorm_1.TypeOrmModule.forRoot(Object.assign(Object.assign({}, config.get('ORM_CONFIG')), { database: config.get('ORM_CONFIG')['database'] + 'tx/tx.sqlite', name: 'tx', entities: [] })),
            typeorm_1.TypeOrmModule.forRoot(Object.assign(Object.assign({}, config.get('ORM_CONFIG')), { database: config.get('ORM_CONFIG')['database'] + 'wallet/wallet.sqlite', name: 'wallet', entities: [] })),
            typeorm_1.TypeOrmModule.forRoot(Object.assign(Object.assign({}, config.get('ORM_CONFIG')), { database: config.get('ORM_CONFIG')['database'] + 'logger/index.sqlite', name: 'logger', entities: [] })),
            typeorm_1.TypeOrmModule.forRoot(Object.assign(Object.assign({}, config.get('ORM_CONFIG')), { database: config.get('ORM_CONFIG')['database'] + 'nft-statistics/nft-statistics.sqlite', name: 'nft-statistics', entities: [] })),
            typeorm_1.TypeOrmModule.forRoot(Object.assign(Object.assign({}, config.get('ORM_CONFIG')), { database: config.get('ORM_CONFIG')['database'] + 'explorer/data.sqlite', name: 'explorer', entities: [] })),
            typeorm_1.TypeOrmModule.forRoot(Object.assign(Object.assign({}, config.get('ORM_CONFIG')), { database: config.get('ORM_CONFIG')['database'] + 'wallet-tx-history/index.sqlite', name: 'wallet-tx-history', entities: [] })),
            graphql_1.GraphQLModule.forRoot({
                driver: apollo_1.ApolloDriver,
                installSubscriptionHandlers: true,
                autoSchemaFile: 'schema.gql',
                introspection: true,
                context: ({ req, res }) => ({ req, res })
            }),
            common_1.CacheModule.register(),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'playground'),
                exclude: ['/graphql*']
            }),
            schedule_1.ScheduleModule.forRoot(),
            throttler_1.ThrottlerModule.forRoot({
                ttl: config.get('RATE_LIMIT')['ttl'],
                limit: config.get('RATE_LIMIT')['limit']
            }),
            event_emitter_1.EventEmitterModule.forRoot(),
            tx_module_1.TxModule,
            stake_module_1.StakeModule,
            market_module_1.MarketModule,
            rpc_module_1.RpcModule,
            smart_contract_module_1.SmartContractModule,
            wallet_module_1.WalletModule,
            contact_module_1.ContactModule,
            logger_module_1.LoggerModule,
            nft_statistics_module_1.NftStatisticsModule,
            explorer_module_1.ExplorerModule,
            wallet_tx_history_module_1.WalletTxHistoryModule
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: guard_1.GqlThrottlerGuard
            }
        ]
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map