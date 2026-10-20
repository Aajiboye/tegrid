import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class AccountDto {
    @ApiProperty({ example: 'John Doe' })
    accountName: string;

    @ApiProperty({ example: '0123456789' })
    accountNumber: string;

    @ApiProperty({ example: '058' })
    bankCode: string;
}

export class BanksDto {
    @ApiProperty({ example: 'Access Bank' })
    name: string;

    @ApiProperty({ example: 'access-bank' })
    slug: string;

    @ApiProperty({ example: '044' })
    code: string;

    @ApiProperty({ example: 'Nigeria' })
    country: string;

    @ApiProperty({ example: 'NGN' })
    currency: string;

    @ApiProperty({ example: 'nuban' })
    type: string;
}

export class ResolveAccountQueryDto {
    @ApiProperty({ example: '0123456789' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{10}$/,
        { message: 'accountNumber must be a valid 10-digit number' })
    accountNumber: string;

    @ApiProperty({ example: '058' })
    @IsString()
    @IsNotEmpty()
    bankCode: string;
}