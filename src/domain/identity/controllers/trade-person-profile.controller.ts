import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequireUserType } from 'src/decorators/require-user-type.decorator';
import { user } from 'src/decorators/user.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserTypeGuard } from 'src/guards/user-type.guard';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { CreateTradePersonProfilePayload, TradePersonProfileAggregateData } from '../dtos/TradePersonProfileDto';
import { TradePerson } from '../models/trade-person-user.model';
import { UserType } from '../enums/user-types.enum';
import { TradePersonProfileService } from '../services/trade-person-profile.service';

@ApiTags('TradePerson Profile')
@Controller('v1/trade-person/profile')
@UseGuards(AuthGuard, UserTypeGuard)
@RequireUserType(UserType.TRADESPERSON)
export class TradePersonProfileController {
  constructor(private readonly tradePersonProfileService: TradePersonProfileService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update authenticated trade person profile' })
  @ApiBody({ type: CreateTradePersonProfilePayload })
  @ApiResponse({ description: 'Aggregated trade person profile', type: TradePersonProfileAggregateData })
  async createProfile(
    @user() tradePerson: TradePerson,
    @Body() payload: CreateTradePersonProfilePayload,
  ) {
    const res = await this.tradePersonProfileService.createProfile(tradePerson, payload);
    return adaptResponse(res, 'Trade person profile saved successfully');
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated trade person aggregated profile' })
  @ApiResponse({ description: 'Aggregated trade person profile', type: Object })
  async getProfile(@user() tradePerson: TradePerson) {
    const res = await this.tradePersonProfileService.getProfile(tradePerson);
    return adaptResponse(res);
  }
}
