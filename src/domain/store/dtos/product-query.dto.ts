import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType } from '../enums/product-type.enum';

export class ProductQueryDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'category-id' })
  category?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 100000, description: 'Minimum price in minor units (e.g., kobo)' })
  minPrice?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 5000000, description: 'Maximum price in minor units (e.g., kobo)' })
  maxPrice?: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'drill' })
  search?: string;

  @IsEnum(ProductType)
  @IsOptional()
  @ApiPropertyOptional({ enum: ProductType })
  type?: ProductType;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 1 })
  page?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 20 })
  size?: number;
}
