import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TradePersonKycStatusResponse {
  profileCompleted: boolean;
  identityCompleted: boolean;
  addressVerificationCompleted: boolean;
}

export class TradePersonProfileDto {
  _id: string;
  @ApiPropertyOptional()
  businessName?: string;
  @ApiPropertyOptional()
  contactName?: string;
  @ApiPropertyOptional()
  phoneNumber?: string;
  @ApiPropertyOptional()
  photoIdUrl?: string;
  @ApiPropertyOptional()
  address?: string;
  @ApiPropertyOptional()
  addressProofUrl?: string;
  @ApiPropertyOptional({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  @ApiPropertyOptional()
  reasonForRejection?: string;
}

export class TradePersonProfileCreationDto {
  @IsString()
  @ApiProperty({ example: 'ACME Ltd' })
  businessName: string;

  @IsString()
  @ApiProperty({ example: 'John Doe' })
  contactName: string;

  @IsString()
  @ApiProperty({ example: '+2348012345678' })
  phoneNumber: string;

  @IsString()
  @ApiProperty({ description: 'Local PIN for verification; stored as hash' })
  pin: string;
}

export class TradePersonIdentityVerificationDto {
  @IsString()
  @ApiProperty({ example: 'NIN' })
  identityType: string;

  @IsString()
  @ApiProperty({ example: '12345678901', description: 'Identity value; will be encrypted at rest' })
  identityData: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional()
  photoIdUrl?: string;
}

export class TradePersonAddressVerificationDto {
  @IsString()
  @ApiProperty()
  address: string;

  @IsString()
  @ApiProperty()
  addressProofUrl: string;
}

export class TradePersonKycRejectionDto {
  @IsString()
  @ApiProperty()
  reason: string;
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
