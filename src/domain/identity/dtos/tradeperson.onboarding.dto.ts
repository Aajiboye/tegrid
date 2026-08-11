import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TradePersonProfileCreationDto {
  @IsString()
  @ApiProperty({ example: 'ACME Ltd' })
  businessName: string;

  @IsString()
  @ApiProperty({ example: 'Jane' })
  contactName: string;

  @IsString()
  @ApiProperty({ example: '+2348012345678' })
  phoneNumber: string;

  @IsString()
  @ApiProperty({ description: 'Local PIN for verification; stored as hash' })
  pin: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Optional URL to a photo ID' })
  photoIdUrl?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  addressProofUrl?: string;
}

export class TradePersonPhoneRequestDto {
  @IsString()
  @ApiProperty({ example: '+2348012345678' })
  phoneNumber: string;
}

export class TradePersonPhoneVerifyDto {
  @IsString()
  @ApiProperty({ example: '+2348012345678' })
  phoneNumber: string;

  @IsString()
  @ApiProperty({ example: '123456' })
  otp: string;
}

export class TradePersonProfileDto {
  _id: string;
  businessName?: string;
  contactName?: string;
  phoneNumber?: string;
  photoIdUrl?: string;
  address?: string;
  addressProofUrl?: string;
  profileCompleted?: boolean;
}
