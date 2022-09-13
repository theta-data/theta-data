import { MarketModule } from 'src/market/market.module'
import { CacheModule, Module } from '@nestjs/common'
import { WalletResolver } from './wallet.resolver'
import { WalletService } from './wallets.service'
import { MarketService } from '../../market/market.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WalletEntity } from './wallet.entity'
import { ActiveWalletsEntity } from './active-wallets.entity'
import { CommonModule } from 'src/common/common.module'
import { WalletsAnalyseService } from './wallets-analyse.service'
import { LatestStakeInfoEntity } from '../stake/latest-stake-info.entity'

@Module({
  imports: [
    CacheModule.register(),
    TypeOrmModule.forFeature([WalletEntity, ActiveWalletsEntity], 'wallet'),
    TypeOrmModule.forFeature([LatestStakeInfoEntity], 'stake'),
    CommonModule,
    MarketModule
  ],
  providers: [WalletResolver, WalletService, WalletsAnalyseService],
  exports: [WalletService]
})
export class WalletModule {}
