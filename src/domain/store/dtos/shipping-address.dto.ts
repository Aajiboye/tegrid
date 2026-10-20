import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateShippingAddressDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Home' })
  label?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'John Doe' })
  recipientName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '+2348012345678' })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '123 Main Street' })
  addressLine1: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Apt 4B' })
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Ikeja' })
  city: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Lagos' })
  state: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Nigeria' })
  country: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '100001' })
  postalCode?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ example: true })
  isDefault?: boolean;
}

export class UpdateShippingAddressDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  label?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  recipientName?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  addressLine1?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  addressLine2?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  city?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  state?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  country?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  postalCode?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  isDefault?: boolean;
}

export class ShippingAddressResponseDto {
  @ApiProperty()
  _id: string;

  @ApiPropertyOptional()
  label?: string;

  @ApiProperty()
  recipientName: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  addressLine1: string;

  @ApiPropertyOptional()
  addressLine2?: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  country: string;

  @ApiPropertyOptional()
  postalCode?: string;

  @ApiPropertyOptional()
  isDefault?: boolean;

  @ApiPropertyOptional()
  createdAt?: string;

  @ApiPropertyOptional()
  updatedAt?: string;
}
