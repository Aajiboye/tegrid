import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ProfileCreationDto{

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

export class ProfileDto{
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

export class BankAccounts {
    @ApiProperty({ example: '1234567890' })
    accountNumber: string;

    @ApiProperty({ example: 'John Doe' })
    accountName: string;

    @ApiProperty({ example: 'XYZ Bank' })
    bankCode: string;
}