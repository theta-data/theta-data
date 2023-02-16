import { analyse } from './../../src/index'
import { TdropService } from './../../src/block-chain/smart-contract/tnt20/tdrop.service'
describe('Tnt20AnalyseService', () => {
  let service: Tnt20AnalyseService
  let tdropService: TdropService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Tnt20AnalyseService]
    }).compile()

    tdropService = module.get<TdropService>(TdropService)
  })

  it('should parse token Mined by nft liquidity', () => {
    expect(tdropService.analyse()).toBeDefined()
  })

  it('should parse token issued for staking reward ', () => {
    expect(service).toBeDefined()
  })

  it('should parse token issued for token transfer ', () => {
    expect(service).toBeDefined()
  })
})
