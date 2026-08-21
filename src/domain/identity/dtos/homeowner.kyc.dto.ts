import { IsOptional, IsString, IsUrl } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HomeOwnerKycStatusResponse{
    profileCompleted: boolean;
    identityCompleted: boolean;
    addressVerificationCompleted: boolean;
}

export class HomeOwnerProfileDto{
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
    address?: string;
    @ApiPropertyOptional()
    addressProofUrl?: string;
    @ApiPropertyOptional({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    @ApiPropertyOptional({ description: 'Reason for rejection when status is REJECTED' })
    reasonForRejection?: string;
}

export class HomeOwnerProfileCreationDto{

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

export class HomeOwnerIdentityVerificationDto{
    @IsString()
    @ApiProperty({ example: 'NIN', description: 'Type of identity provided (e.g., NIN, DRIVERS_LICENSE)' })
    identityType: string;

    @IsString()
    @ApiProperty({ example: '12345678901', description: 'Identity value; will be encrypted at rest' })
    identityData: string;

    @IsString()
    @IsOptional()
    @IsUrl()
    @ApiPropertyOptional({ description: 'Optional URL to a photo ID image' })
    photoIdUrl?: string;
}

export class HomeOwnerAddressVerificationDto{
    @IsString()
    @ApiProperty({ example: '12 Baker Street' })
    homeAddress: string;

    @ApiProperty({ example: 'https://.../address-proof.jpg' })
    @IsString()
    addressProofUrl: string;
}

export class HomeOwnerKycRejectionDto{
    @IsString()
    @ApiProperty({ description: 'Reason for rejecting the KYC' })
    reason: string;
}

export class HomeOwnerPhoneRequestDto {
    @IsString()
    @ApiProperty({ example: '+2348012345678' })
    phoneNumber: string;
}

export class HomeOwnerPhoneVerifyDto {
    @IsString()
    @ApiProperty({ example: '+2348012345678' })
    phoneNumber: string;

    @IsString()
    @ApiProperty({ example: '123456' })
    otp: string;
}