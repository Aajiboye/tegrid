import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType } from '../enums/product-type.enum';

export class ProductQueryDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'category-id' })
  category?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 1000 })
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 50000 })
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
