export class HomeOwnerKycStatusResponse{
    profileItemsCompleted: number;
    totalProfileItems: number;
    identityItemsCompleted: number;
    totalIdentityItems: number;
    addressVerificationCompleted: number;
    totalAddressVerificationItems: number;
}

export class HomeOwnerProfileDto{
    firstName: string;
    lastName: string;
    middleName: string;
    phoneNumber: string;
    photoIdUrl: string;
}

export class HomeOwnerProfileCreationDto{
    firstName: string;
    lastName: string;
    middleName: string;
    phoneNumber: string;
    pin: string;
    nin: string;
    photoIdUrl: string;
    homeAddress: string;
    addressProofUrl: string;
}
