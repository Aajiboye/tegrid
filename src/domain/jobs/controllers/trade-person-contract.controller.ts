import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserTypeGuard } from 'src/guards/user-type.guard';
import { RequireUserType } from 'src/decorators/require-user-type.decorator';
import { user } from 'src/decorators/user.decorator';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { JobRequestQuotationService } from '../services/job-request-quotation.service';
import { TradePersonContractQueryDto, TradePersonContractResponseDto } from '../dtos/trade-person-contract.dto';
import { UserType } from 'src/domain/identity/enums/user-types.enum';
import { TradePerson } from 'src/domain/identity/models/trade-person-user.model';

@ApiTags('TradePerson Contracts')
@Controller('v1/tradeperson/contracts')
@UseGuards(AuthGuard, UserTypeGuard)
@RequireUserType(UserType.TRADESPERSON)
export class TradePersonContractController {
  constructor(private readonly quotationService: JobRequestQuotationService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'TradePerson: List contracts, optionally filter by status' })
  @ApiResponse({ description: 'Contracts retrieved', type: [TradePersonContractResponseDto] })
  async listContracts(
    @user() currentUser: TradePerson,
    @Query() query: TradePersonContractQueryDto,
  ) {
    const docs = await this.quotationService.getTradePersonContracts(
      currentUser._id.toString(),
      query,
    );
    return adaptResponse(docs, 'Contracts retrieved successfully');
  }
}
