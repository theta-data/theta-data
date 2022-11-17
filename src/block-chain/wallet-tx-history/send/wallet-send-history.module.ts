import { RpcModule } from '../../rpc/rpc.module'
import { Module } from '@nestjs/common'

@Module({
  imports: [RpcModule],
  controllers: [],
  providers: [],
  exports: []
})
export class WalletSendHistoryModule {}
