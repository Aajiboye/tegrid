import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { adaptResponse } from '../../../shared/adapters/response.adapter';
import { HomeOwnerKycService } from '../services/home-owner-kyc.service';
import { user } from 'src/decorators/user.decorator';
import { User } from '../models/user.model';
import { AuthGuard } from 'src/guards/auth.guard';

@ApiTags('Home Owner KYC')
@Controller('v1/home-owner-kyc')
export class HomeOwnerKycController {
  constructor(private readonly homeOwnerKycService: HomeOwnerKycService) {}

  @Get('/status')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get Home Owner KYC Profile Status' })
  async getStatus(@user() user: User) {
    const res = await this.homeOwnerKycService.getKycStatus(user);
    return adaptResponse(res);
  }
}