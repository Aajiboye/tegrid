import { HomeOwnerKycStatusResponse, HomeOwnerProfileCreationDto, HomeOwnerProfileDto } from "../dtos/homeowner.kyc.dto";
import { User } from "../models/user.model";

export interface IHomeOwnerKyc {
   getKycStatus(user:User): Promise<HomeOwnerKycStatusResponse>;
   completeProfile(user:User, profileData:HomeOwnerProfileCreationDto): Promise<HomeOwnerProfileDto>;
   verifyPhoneNumber(user:User, phoneNumber:string, otp:string): Promise<void>;
   requestPhoneVerificationOtp(user:User, phoneNumber:string): Promise<void>;
}
