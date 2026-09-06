import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TradePersonProfileDto {
  _id: string;
  @ApiProperty()
  
  firstName?: string;
  @ApiProperty()
  lastName?: string;
  @ApiPropertyOptional()
  middleName?: string;
  @ApiPropertyOptional()
  phoneNumber?: string;
  @ApiPropertyOptional({ description: 'URL to uploaded photo ID' })
  photoIdUrl?: string;
  @ApiPropertyOptional()
  addressProofUrl?: string;
  @ApiPropertyOptional()
  dob?: string;
  @ApiPropertyOptional()
  homeAddress?: string;

  @ApiPropertyOptional()
  healthAndSafetyCertificateUrl?: string;

  @ApiPropertyOptional()
  healthAndSafetyCertificateExpiryDate?: string;

  @ApiPropertyOptional()
  healthAndSafetyCertificateIssueDate?: string;

  @ApiPropertyOptional()
  policeCharacterReportUrl?: string;
  @ApiPropertyOptional()
  identityType?: string;

  bankAccounts?: {
    accountNumber: string;
    accountName: string;
    bankCode: string;
  }[];

  @ApiPropertyOptional()
  mainTradeUrl?: string;
  @ApiPropertyOptional({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  @ApiPropertyOptional({ description: 'Reason for rejection when status is REJECTED' })
  reasonForRejection?: string;
}

export class TradePersonProfileCreationDto {
  @IsString()
  @ApiProperty({ example: 'John' })
  firstName: string;

  @IsString()
  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  middleName?: string;

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

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  addressProofUrl?: string;
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

export class TradePersonKycStatusResponse {
  profileCompleted: boolean;
  personalInformationCompleted: boolean;
  identityCompleted: boolean;
  healthAndSafetyComplianceCompleted: boolean;
  policeCharacterReportCompleted: boolean;
  bankDetailsCompleted: boolean;
  mainTradeCompleted: boolean;
}

export class PersonalInformationDto {
  @IsString()
  @ApiProperty({ example: '1990-01-01' })
  dob: string;

  @IsString()
  @ApiProperty({ example: '123 Main St, Lagos, Nigeria' })
  homeAddress: string;
}

export class HealthAndSafetyComplianceDto {
  @IsString()
  @ApiProperty({ example: 'https://example.com/certificate.pdf' })
  certificateUrl: string;

  @IsString()
  @ApiProperty({ example: '2025-12-31' })
  expiryDate: string;

  @IsString()
  @ApiProperty({ example: '2020-01-01' })
  issuedDate: string;
}

export class PoliceCharacterReportDto {
  @IsString()
  @ApiProperty({ example: 'https://example.com/police-report.pdf' })
  certificateUrl: string;
}

export class BankDetailsDto {
  @IsString()
  @ApiProperty({ example: '1234567890' })
  accountNumber: string;

  @IsString()
  @ApiProperty({ example: '123' })
  bankCode: string;
}

export class MainTradeDto { }