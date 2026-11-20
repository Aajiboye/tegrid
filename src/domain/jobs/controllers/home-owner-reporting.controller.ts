import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserTypeGuard } from 'src/guards/user-type.guard';
import { RequireUserType } from 'src/decorators/require-user-type.decorator';
import { user } from 'src/decorators/user.decorator';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { UserType } from 'src/domain/identity/enums/user-types.enum';
import { HomeOwner } from 'src/domain/identity/models/home-owner-user.model';
import { HomeOwnerReportingService } from '../services/home-owner-reporting.service';
import {
  HomeOwnerReportingOverviewDto,
  HomeOwnerTransactionHistoryQueryDto,
  HomeOwnerTransactionExportQueryDto,
  HomeOwnerTransactionDetailDto,
} from '../dtos/home-owner-reporting.dto';

@ApiTags('HomeOwner Reporting')
@Controller('v1/homeowner/reporting')
@UseGuards(AuthGuard, UserTypeGuard)
@RequireUserType(UserType.HomeOwner)
export class HomeOwnerReportingController {
  constructor(private readonly reportingService: HomeOwnerReportingService) {}

  @Get('overview')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'HomeOwner: Reporting overview (total spent, pending, completed, failed)' })
  @ApiResponse({ description: 'Reporting overview retrieved', type: HomeOwnerReportingOverviewDto })
  async getOverview(@user() currentUser: HomeOwner) {
    const data = await this.reportingService.getOverview(currentUser._id.toString());
    return adaptResponse(data, 'Reporting overview retrieved successfully');
  }

  @Get('transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'HomeOwner: Transaction history with filters' })
  async getTransactions(@user() currentUser: HomeOwner, @Query() query: HomeOwnerTransactionHistoryQueryDto) {
    const data = await this.reportingService.getTransactionHistory(currentUser._id.toString(), query);
    return adaptResponse(data, 'Transaction history retrieved successfully');
  }

  @Get('transactions/export')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'HomeOwner: Export transaction history as CSV/PDF' })
  async exportTransactions(
    @user() currentUser: HomeOwner,
    @Query() query: HomeOwnerTransactionExportQueryDto,
    @Res() res: Response,
  ) {
    const file = await this.reportingService.exportTransactions(currentUser._id.toString(), query, query.format);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    return res.send(Buffer.isBuffer(file.content) ? file.content : Buffer.from(String(file.content)));
  }

  @Get('transactions/:transactionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'HomeOwner: Transaction detail' })
  @ApiResponse({ description: 'Transaction detail retrieved', type: HomeOwnerTransactionDetailDto })
  async getTransactionDetail(@user() currentUser: HomeOwner, @Param('transactionId') transactionId: string) {
    const data = await this.reportingService.getTransactionDetail(currentUser._id.toString(), transactionId);
    return adaptResponse(data, 'Transaction detail retrieved successfully');
  }

  @Get('transactions/:transactionId/export')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'HomeOwner: Export transaction detail as CSV/PDF' })
  async exportTransactionDetail(
    @user() currentUser: HomeOwner,
    @Param('transactionId') transactionId: string,
    @Query('format') format: 'csv' | 'pdf',
    @Res() res: Response,
  ) {
    const file = await this.reportingService.exportTransactionDetail(currentUser._id.toString(), transactionId, format || 'csv');
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    return res.send(Buffer.isBuffer(file.content) ? file.content : Buffer.from(String(file.content)));
  }
}
