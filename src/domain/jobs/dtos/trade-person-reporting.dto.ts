import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum TransactionDateFilter {
  ALL = 'ALL',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_60_DAYS = 'LAST_60_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
}

export enum TransactionTypeFilter {
  ALL = 'ALL',
  PAYMENT = 'PAYMENT',
  RELEASE = 'RELEASE',
}

export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf',
}

export class TradePersonTransactionHistoryQueryDto {
  @IsOptional()
  @IsEnum(TransactionDateFilter)
  @ApiPropertyOptional({ enum: TransactionDateFilter, default: TransactionDateFilter.ALL })
  dateFilter?: TransactionDateFilter;

  @IsOptional()
  @IsEnum(TransactionTypeFilter)
  @ApiPropertyOptional({ enum: TransactionTypeFilter, default: TransactionTypeFilter.ALL })
  type?: TransactionTypeFilter;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '1' })
  page?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '20' })
  size?: string;
}

export class TradePersonTransactionExportQueryDto extends TradePersonTransactionHistoryQueryDto {
  @IsEnum(ExportFormat)
  @ApiProperty({ enum: ExportFormat, example: ExportFormat.CSV })
  format: ExportFormat;
}

export class TradePersonReportingOverviewDto {
  @ApiProperty()
  totalEarned: number;

  @ApiProperty()
  netEarnings: number;

  @ApiProperty()
  pendingEarnings: number;

  @ApiProperty()
  availableEarnings: number;

  @ApiProperty({ example: 'NGN' })
  currency: string;
}

export class TradePersonTransactionItemDto {
  @ApiProperty()
  _id: string;

  @ApiProperty({ enum: ['PAYMENT', 'RELEASE'] })
  type: 'PAYMENT' | 'RELEASE';

  @ApiProperty()
  amount: number;

  @ApiProperty({ example: 'NGN' })
  currency: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  reference?: string;

  @ApiPropertyOptional()
  releaseType?: string;

  @ApiProperty()
  jobRequestId: string;

  @ApiProperty()
  quotationId: string;

  @ApiProperty()
  createdAt: string;
}

export class TradePersonTransactionDetailDto extends TradePersonTransactionItemDto {
  @ApiPropertyOptional()
  jobTitle?: string;

  @ApiPropertyOptional()
  jobDescription?: string;

  @ApiPropertyOptional()
  homeAddress?: string;

  @ApiPropertyOptional()
  quotationTotalAmount?: number;

  @ApiPropertyOptional()
  quotationStatus?: string;

  @ApiPropertyOptional()
  paymentStatus?: string;

  @ApiPropertyOptional()
  releaseStatus?: string;

  @ApiPropertyOptional()
  subtotal?: number;

  @ApiPropertyOptional()
  deliveryFee?: number;

  @ApiPropertyOptional()
  vat?: number;

  @ApiPropertyOptional()
  total?: number;
}
