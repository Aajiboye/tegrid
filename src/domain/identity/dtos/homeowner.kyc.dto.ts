import { IsOptional, IsString, IsUrl } from "class-validator";
import { URL } from "url";

export class HomeOwnerKycStatusResponse{
    profileCompleted: boolean;
    identityCompleted: boolean;
    addressVerificationCompleted: boolean;
}

export class HomeOwnerProfileDto{
    _id: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    phoneNumber?: string;
    photoIdUrl?: string;
    address?: string;
    addressProofUrl?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    reasonForRejection?: string;
}

export class HomeOwnerProfileCreationDto{

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsString()
    @IsOptional()
    middleName?: string;

    @IsString()
    phoneNumber: string;

    @IsString()
    pin: string;

}

export class HomeOwnerIdentityVerificationDto{
    @IsString()
    nin: string;

    @IsString()
    @IsOptional()
    @IsUrl()
    photoIdUrl?: string;
}

export class HomeOwnerAddressVerificationDto{
    @IsString()
    homeAddress: string;

    @IsString()
    addressProofUrl: string;
}

export class HomeOwnerKycRejectionDto{
    @IsString()
    reason: string;
}