import { HomeOwnerKycStatusResponse, HomeOwnerProfileCreationDto, HomeOwnerProfileDto } from "../dtos/homeowner.kyc.dto";
import { User } from "../models/user.model";

export interface IHomeOwnerKyc {
   getKycStatus(user:User): Promise<HomeOwnerKycStatusResponse>;
   completeProfile(user:User, profileData:HomeOwnerProfileCreationDto): Promise<HomeOwnerProfileDto>;
   verifyPhoneNumber(user:User, phoneNumber:string, otp:string): Promise<void>;
   requestPhoneVerificationOtp(user:User, phoneNumber:string): Promise<void>;
   completeIdentityVerification(user:User, identityType:string, identityData:string, photoIdUrl?:string): Promise<HomeOwnerProfileDto>;
   getDecryptedIdentityData(user:User, encryptionKey?:string): Promise<string | null>;
   completeAddressVerification(user:User, address:string, addressProofUrl:string): Promise<HomeOwnerProfileDto>;
   getKycProfile(user:User): Promise<HomeOwnerProfileDto>;
}
