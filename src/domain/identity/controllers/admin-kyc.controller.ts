import { Controller, Param, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { adaptResponse } from '../../../shared/adapters/response.adapter';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { user } from 'src/decorators/user.decorator';
import { TradePersonKycRejectionDto, TradePersonProfileDto } from '../dtos/tradeperson.kyc.dto';
import { HomeOwnerKycRejectionDto, HomeOwnerProfileDto } from '../dtos/homeowner.kyc.dto';
import { TradePersonKycService } from '../services/trade-person-kyc.service';
import { HomeOwnerKycService } from '../services/home-owner-kyc.service';
import { HomeOwner } from '../models/home-owner-user.model';

@ApiTags('Admin KYC')
@Controller('v1/admin/kyc')
export class AdminKycController {
  constructor(
    private readonly tradePersonKycService: TradePersonKycService,
    private readonly homeOwnerKycService: HomeOwnerKycService,
  ) {}

  // TradePerson admin endpoints
  @Post('/trade-person/:id/approve')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Admin: Approve a TradePerson KYC' })
  @ApiResponse({ description: 'KYC approved', type: TradePersonProfileDto })
  async approveTradePersonKyc(@user() user: HomeOwner, @Param('id') id: string) {
    const res = await this.tradePersonKycService.approveKyc(id, user._id.toString());
    return adaptResponse(res, 'KYC approved');
  }

  @Post('/trade-person/:id/reject')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Admin: Reject a TradePerson KYC' })
  @ApiResponse({ description: 'KYC rejected', type: TradePersonProfileDto })
  async rejectTradePersonKyc(@user() user: HomeOwner, @Param('id') id: string, @Body() payload: TradePersonKycRejectionDto) {
    const res = await this.tradePersonKycService.rejectKyc(id, user._id.toString(), payload.reason);
    return adaptResponse(res, 'KYC rejected');
  }

  // HomeOwner admin endpoints
  @Post('/home-owner/:id/approve')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Admin: Approve a HomeOwner KYC' })
  @ApiResponse({ description: 'KYC approved', type: HomeOwnerProfileDto })
  async approveHomeOwnerKyc(@user() user: HomeOwner, @Param('id') id: string) {
    const res = await this.homeOwnerKycService.approveKyc(id, user._id.toString());
    return adaptResponse(res, 'KYC approved');
  }

  @Post('/home-owner/:id/reject')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Admin: Reject a HomeOwner KYC' })
  @ApiResponse({ description: 'KYC rejected', type: HomeOwnerProfileDto })
  async rejectHomeOwnerKyc(@user() user: HomeOwner, @Param('id') id: string, @Body() payload: HomeOwnerKycRejectionDto) {
    const res = await this.homeOwnerKycService.rejectKyc(id, user._id.toString(), payload.reason);
    return adaptResponse(res, 'KYC rejected');
  }
}
