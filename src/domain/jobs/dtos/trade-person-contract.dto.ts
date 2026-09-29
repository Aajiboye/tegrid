import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { JobRequestQuotationResponseDto } from './job-request-quotation.dto';

export enum ContractStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export class TradePersonContractQueryDto {
  @IsEnum(ContractStatus)
  @IsOptional()
  @ApiPropertyOptional({ enum: ContractStatus, example: ContractStatus.PENDING })
  status?: ContractStatus;
}

export class TradePersonContractResponseDto {
  @ApiProperty()
  jobRequest: any;

  @ApiProperty({ enum: ContractStatus })
  status: ContractStatus;

  @ApiPropertyOptional({ type: JobRequestQuotationResponseDto })
  quotation?: JobRequestQuotationResponseDto;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
