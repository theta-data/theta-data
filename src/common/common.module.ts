import { Module } from '@nestjs/common'
import { LoggerService } from './logger.service'
import { SolcService } from './solc.service'
import { UtilsService } from './utils.service'

@Module({
  imports: [],
  providers: [SolcService, UtilsService, LoggerService],
  exports: [SolcService, UtilsService, LoggerService]
})
export class CommonModule {}
