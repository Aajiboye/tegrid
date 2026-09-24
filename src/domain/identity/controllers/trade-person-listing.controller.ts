import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { TradePersonListingItemDto } from '../dtos/TradePersonProfileDto';
import { TradePersonKycService } from '../services/trade-person-kyc.service';

@ApiTags('TradePerson Listing')
@Controller('v1/tradepersons')
export class TradePersonListingController {
  constructor(private readonly tradePersonKycService: TradePersonKycService) {}

  @Get()
  @ApiOperation({ summary: 'List approved tradespersons with complete KYC' })
  @ApiResponse({ description: 'List of approved tradespersons', type: [TradePersonListingItemDto] })
  async listApprovedTradePersons() {
    const res = await this.tradePersonKycService.listApprovedTradePersons();
    return adaptResponse(res);
  }
}
