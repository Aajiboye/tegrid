import { IsArray, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MaterialDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'PVC pipes' })
  description: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'PVC-001' })
  materialCode: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 10 })
  quantity: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ example: 500 })
  unitPrice?: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 7.5 })
  vat: number;
}

export class ToolDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Pipe wrench' })
  description: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'WR-001' })
  materialCode: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 2 })
  quantity: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ example: 1500 })
  unitPrice?: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 7.5 })
  vat: number;
}

export class WorkmanshipDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Labour for pipe installation' })
  description: string;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ example: 5000 })
  price?: number;
}

export class CreateJobRequestQuotationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialDto)
  @ApiProperty({ type: [MaterialDto] })
  materials: MaterialDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToolDto)
  @ApiProperty({ type: [ToolDto] })
  tools: ToolDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkmanshipDto)
  @ApiProperty({ type: [WorkmanshipDto] })
  workmanships: WorkmanshipDto[];
}

export class UpdateJobRequestQuotationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialDto)
  @IsOptional()
  @ApiPropertyOptional({ type: [MaterialDto] })
  materials?: MaterialDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToolDto)
  @IsOptional()
  @ApiPropertyOptional({ type: [ToolDto] })
  tools?: ToolDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkmanshipDto)
  @IsOptional()
  @ApiPropertyOptional({ type: [WorkmanshipDto] })
  workmanships?: WorkmanshipDto[];
}

export class ReviewQuotationDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'ACCEPTED', description: 'ACCEPTED or REJECTED' })
  status: 'ACCEPTED' | 'REJECTED';

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Price is too high', description: 'Required when rejecting' })
  reason?: string;
}

export class TradePersonSummaryDto {
  @ApiProperty({ example: '64f8c2e...' })
  _id: string;

  @ApiProperty({ example: 'johndoe' })
  userName?: string;

  @ApiProperty({ example: 'john@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  profileAvatar?: string;
}

export class QuotationEventResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  quotation: string;

  @ApiProperty()
  jobRequest: string;

  @ApiProperty({ example: 'QUOTE_SUBMITTED' })
  eventType: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  tradePerson?: string;

  @ApiPropertyOptional()
  performedBy?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class JobRequestQuotationResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty({ example: 'A3B7K9' })
  quoteId: string;

  @ApiProperty()
  jobRequest: string;

  @ApiProperty({ type: TradePersonSummaryDto })
  tradePerson: TradePersonSummaryDto;

  @ApiProperty({ type: [MaterialDto] })
  materials: MaterialDto[];

  @ApiProperty({ type: [ToolDto] })
  tools: ToolDto[];

  @ApiProperty({ type: [WorkmanshipDto] })
  workmanships: WorkmanshipDto[];

  @ApiProperty({ example: 'PENDING' })
  reviewStatus: string;

  @ApiPropertyOptional({ example: 'Price is too high' })
  rejectionReason?: string;

  @ApiProperty({ type: [QuotationEventResponseDto] })
  events: QuotationEventResponseDto[];

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
