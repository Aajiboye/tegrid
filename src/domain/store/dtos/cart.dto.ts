import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType } from '../enums/product-type.enum';

export class AddCartItemDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'product-id' })
  productId: string;

  @IsEnum(ProductType)
  @ApiProperty({ enum: ProductType, example: ProductType.PURCHASE })
  type: ProductType;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ example: 1 })
  quantity: number;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({ example: '2026-10-25T10:00:00Z' })
  rentalStart?: string;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({ example: '2026-10-27T10:00:00Z' })
  rentalEnd?: string;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ example: 2 })
  quantity: number;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional()
  rentalStart?: string;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional()
  rentalEnd?: string;
}

export class CartItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty({ enum: ProductType })
  type: ProductType;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  rentalStart?: string;

  @ApiPropertyOptional()
  rentalEnd?: string;

  @ApiPropertyOptional()
  rentalDuration?: number;

  @ApiPropertyOptional()
  image?: string;
}

export class CartResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  expiresAt: string;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  itemCount: number;
}
