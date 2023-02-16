import { TdropMinedByNft, TdropStakeReward, TdropTransfer } from './tdrop.model'
import { Injectable } from '@nestjs/common'

@Injectable()
export class TdropService {
  constructor() {}

  public async getTdrop() {
    return 'hello tdrop'
  }

  public async parseData(): Promise<TdropMinedByNft | TdropStakeReward | TdropTransfer> {}
}
