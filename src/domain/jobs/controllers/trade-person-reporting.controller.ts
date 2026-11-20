import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserTypeGuard } from 'src/guards/user-type.guard';
import { RequireUserType } from 'src/decorators/require-user-type.decorator';
import { user } from 'src/decorators/user.decorator';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { UserType } from 'src/domain/identity/enums/user-types.enum';
import { TradePerson } from 'src/domain/identity/models/trade-person-user.model';
import { TradePersonReportingService } from '../services/trade-person-reporting.service';
import {
  TradePersonReportingOverviewDto,
  TradePersonTransactionHistoryQueryDto,
  TradePersonTransactionExportQueryDto,
  TradePersonTransactionDetailDto,
} from '../dtos/trade-person-reporting.dto';

@ApiTags('TradePerson Reporting')
@Controller('v1/tradeperson/reporting')
@UseGuards(AuthGuard, UserTypeGuard)
@RequireUserType(UserType.TRADESPERSON)
export class TradePersonReportingController {
  constructor(private readonly reportingService: TradePersonReportingService) {}

  @Get('overview')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'TradePerson: Reporting overview (total earned, net, pending, available)' })
  @ApiResponse({ description: 'Reporting overview retrieved', type: TradePersonReportingOverviewDto })
  async getOverview(@user() currentUser: TradePerson) {
    const data = await this.reportingService.getOverview(currentUser._id.toString());
    return adaptResponse(data, 'Reporting overview retrieved successfully');
  }

  @Get('transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'TradePerson: Transaction history with filters' })
  async getTransactions(@user() currentUser: TradePerson, @Query() query: TradePersonTransactionHistoryQueryDto) {
    const data = await this.reportingService.getTransactionHistory(currentUser._id.toString(), query);
    return adaptResponse(data, 'Transaction history retrieved successfully');
  }

  @Get('transactions/export')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'TradePerson: Export transaction history as CSV/PDF' })
  async exportTransactions(
    @user() currentUser: TradePerson,
    @Query() query: TradePersonTransactionExportQueryDto,
    @Res() res: Response,
  ) {
    const file = await this.reportingService.exportTransactions(currentUser._id.toString(), query, query.format);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    return res.send(Buffer.isBuffer(file.content) ? file.content : Buffer.from(String(file.content)));
  }

  @Get('transactions/:transactionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'TradePerson: Transaction detail' })
  @ApiResponse({ description: 'Transaction detail retrieved', type: TradePersonTransactionDetailDto })
  async getTransactionDetail(@user() currentUser: TradePerson, @Param('transactionId') transactionId: string) {
    const data = await this.reportingService.getTransactionDetail(currentUser._id.toString(), transactionId);
    return adaptResponse(data, 'Transaction detail retrieved successfully');
  }

  @Get('transactions/:transactionId/export')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'TradePerson: Export transaction detail as CSV/PDF' })
  async exportTransactionDetail(
    @user() currentUser: TradePerson,
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
