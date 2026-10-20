import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductType } from '../enums/product-type.enum';
import { RentalGranularity } from '../enums/rental-granularity.enum';

export class MoneyAmountDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'NGN' })
  currencyCode: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ example: 5000 })
  amount: number;
}

export class RentalConfigDto {
  @IsEnum(RentalGranularity)
  @ApiProperty({ enum: RentalGranularity, example: RentalGranularity.DAILY })
  granularity: RentalGranularity;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MoneyAmountDto)
  @ArrayMinSize(1)
  @ApiProperty({ type: [MoneyAmountDto] })
  pricePerUnit: MoneyAmountDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ example: 2, description: 'Minimum rental duration in granularity units' })
  minimumDuration?: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ example: 5, description: 'Number of units available for rent' })
  quantity: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Bosch Cordless Drill' })
  name: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Professional 18V cordless drill with 2 batteries' })
  description?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'BOS-DRILL-001' })
  sku: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'category-id' })
  category: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: [String], example: ['https://cloudinary.com/...'] })
  images?: string[];

  @IsEnum(ProductType)
  @ApiProperty({ enum: ProductType, example: ProductType.PURCHASE })
  type: ProductType;

  @ValidateIf((o) => o.type === ProductType.PURCHASE)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MoneyAmountDto)
  @ArrayMinSize(1)
  @ApiProperty({ type: [MoneyAmountDto], required: false })
  prices?: MoneyAmountDto[];

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ example: 10 })
  stockQuantity: number;

  @ValidateIf((o) => o.type === ProductType.RENTAL)
  @ValidateNested()
  @Type(() => RentalConfigDto)
  @ApiProperty({ type: RentalConfigDto, required: false })
  rentalConfig?: RentalConfigDto;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  category?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: [String] })
  images?: string[];

  @IsEnum(ProductType)
  @IsOptional()
  @ApiPropertyOptional({ enum: ProductType })
  type?: ProductType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MoneyAmountDto)
  @IsOptional()
  @ApiPropertyOptional({ type: [MoneyAmountDto] })
  prices?: MoneyAmountDto[];

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional()
  stockQuantity?: number;

  @ValidateNested()
  @Type(() => RentalConfigDto)
  @IsOptional()
  @ApiPropertyOptional({ type: RentalConfigDto })
  rentalConfig?: RentalConfigDto;
}

export class ReviewProductDto {
  @IsEnum(ProductStatus)
  @IsNotEmpty()
  @ApiProperty({ enum: [ProductStatus.APPROVED, ProductStatus.REJECTED] })
  status: ProductStatus.APPROVED | ProductStatus.REJECTED;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  rejectionReason?: string;
}

export class ProductResponseDto {
  @ApiProperty()
  _id: string;

  @ApiPropertyOptional()
  currency?: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  category: any;

  @ApiPropertyOptional({ type: [String] })
  images?: string[];

  @ApiProperty({ enum: ProductType })
  type: ProductType;

  @ApiPropertyOptional({ type: [MoneyAmountDto] })
  prices?: MoneyAmountDto[];

  @ApiProperty()
  stockQuantity: number;

  @ApiProperty()
  availableForPurchase: number;

  @ApiPropertyOptional({ type: RentalConfigDto })
  rentalConfig?: RentalConfigDto;

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatus;

  @ApiPropertyOptional()
  rejectionReason?: string | null;

  @ApiProperty()
  createdBy: string;

  @ApiPropertyOptional()
  approvedBy?: string | null;

  @ApiPropertyOptional()
  approvedAt?: string | null;

  @ApiPropertyOptional()
  createdAt?: string;

  @ApiPropertyOptional()
  updatedAt?: string;
}

export class ProductPriceDto {
  @ApiProperty()
  currencyCode: string;

  @ApiProperty()
  amount: number;
}

export class ProductListItemDto extends ProductResponseDto {}
