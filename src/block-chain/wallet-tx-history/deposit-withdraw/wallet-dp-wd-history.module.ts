import { LatestStakeInfoEntity } from './../../stake/latest-stake-info.entity'
import { WalletDpWdHistoryEntity } from './wallet-dp-wp-history.entity'
import { RpcModule } from './../../rpc/rpc.module'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    RpcModule,
    TypeOrmModule.forFeature([WalletDpWdHistoryEntity], 'wallet-deposit-withdraw-history'),
    TypeOrmModule.forFeature([LatestStakeInfoEntity], 'stake')
  ],
  controllers: [],
  providers: [],
  exports: []
})
export class WalletDpWdHistoryModule {}
