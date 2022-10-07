import { WalletTxHistoryModule } from './block-chain/wallet-tx-history/wallet-tx-history.module'
import { StakeAnalyseService } from './block-chain/stake/stake-analyse.service'
import { StakeModule } from './block-chain/stake/stake.module'
import { WalletsAnalyseService } from './block-chain/wallet/wallets-analyse.service'
import { SmartContractAnalyseService } from './block-chain/smart-contract/smart-contract-analyse.service'
import { SmartContractModule } from './block-chain/smart-contract/smart-contract.module'
import { NftAnalyseService } from './block-chain/smart-contract/nft/nft-analyse.service'
import { NftModule } from './block-chain/smart-contract/nft/nft.module'
import { NftStatisticsAnalyseService } from './statistics/nft/nft-statistics-analyse.service'
import { NftStatisticsModule } from './statistics/nft/nft-statistics.module'
import { ExplorerAnalyseService } from './block-chain/explorer/explorer-analyse.service'
import { ExplorerModule } from './block-chain/explorer/explorer.module'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { TxAnalyseService } from './block-chain/tx/tx-analyse.service'
import { TxModule } from './block-chain/tx/tx.module'
import { WalletModule } from './block-chain/wallet/wallet.module'
import { WalletTxHistoryAnalyseService } from './block-chain/wallet-tx-history/wallet-tx-history-analyse.service'

export async function analyseBootstrap(except: Array<string> | undefined) {
  let i = 0
  while (1) {
    const app = await NestFactory.createApplicationContext(AppModule)
    const tx = app.select(TxModule).get(TxAnalyseService, { strict: true })
    const explorer = app.select(ExplorerModule).get(ExplorerAnalyseService, { strict: true })
    const smartContract = app
      .select(SmartContractModule)
      .get(SmartContractAnalyseService, { strict: true })
    const wallet = app.select(WalletModule).get(WalletsAnalyseService, { strict: true })

    const nft = app.select(NftModule).get(NftAnalyseService, { strict: true })
    const stake = app.select(StakeModule).get(StakeAnalyseService, { strict: true })
    const nftStatistics = app
      .select(NftStatisticsModule)
      .get(NftStatisticsAnalyseService, { strict: true })

    const walletTxHistory = app
      .select(WalletTxHistoryModule)
      .get(WalletTxHistoryAnalyseService, { strict: true })
    // await Promise.race([
    //   tx.analyseData(),
    //   new Promise((resolve, reject) => {
    //     setTimeout(() => {
    //       resolve('timeout')
    //       console.log('analyse race timeout')
    //       // this.logger.debug('timeout')
    //     }, 1000 * 60 * 5)
    //   })
    // ])
    // await Promise.race([
    //   explorer.analyseData(),
    //   new Promise((resolve, reject) => {
    //     setTimeout(() => {
    //       resolve('timeout')
    //       console.log('analyse race timeout')
    //       // this.logger.debug('timeout')
    //     }, 1000 * 60 * 5)
    //   })
    // ])
    await tx.analyseData()
    await explorer.analyseData()
    await smartContract.analyseData()
    await wallet.analyseData()

    if (except && !except.includes('nft')) {
      await nft.analyseData(i)
    }
    await stake.analyseData()
    await nftStatistics.analyseData()
    await walletTxHistory.analyseData()
    await new Promise((resolve) => setTimeout(resolve, 1000))
    app.close()
    i++
  }
}
// analyseBootstrap()
