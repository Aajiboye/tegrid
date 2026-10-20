import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProductCategoryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Power Tools' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'power-tools' })
  slug: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Electric and battery-powered tools' })
  description?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/...' })
  image?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ example: true })
  isActive?: boolean;
}

export class UpdateProductCategoryDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Power Tools' })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'power-tools' })
  slug?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Electric and battery-powered tools' })
  description?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/...' })
  image?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ example: true })
  isActive?: boolean;
}

export class ProductCategoryResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  image?: string;

  @ApiPropertyOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  createdAt?: string;

  @ApiPropertyOptional()
  updatedAt?: string;
}
