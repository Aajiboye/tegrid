import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ExportFormat, TransactionDateFilter, TransactionTypeFilter } from './trade-person-reporting.dto';

export class HomeOwnerTransactionHistoryQueryDto {
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

export class HomeOwnerTransactionExportQueryDto extends HomeOwnerTransactionHistoryQueryDto {
  @IsEnum(ExportFormat)
  @ApiProperty({ enum: ExportFormat, example: ExportFormat.CSV })
  format: ExportFormat;
}

export class HomeOwnerReportingOverviewDto {
  @ApiProperty()
  totalSpent: number;

  @ApiProperty()
  pendingPayments: number;

  @ApiProperty()
  completedPayments: number;

  @ApiProperty()
  failedPayments: number;

  @ApiProperty({ example: 'NGN' })
  currency: string;
}

export class HomeOwnerTransactionItemDto {
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

export class HomeOwnerTransactionDetailDto extends HomeOwnerTransactionItemDto {
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
