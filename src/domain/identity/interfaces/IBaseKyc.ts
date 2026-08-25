import { ProfileCreationDto, ProfileDto } from "../dtos/kyc.dto";
import { TradePersonProfileCreationDto } from "../dtos/tradeperson.kyc.dto";

export interface IBaseKyc {
   completeProfile(user:any, profileData:ProfileCreationDto | TradePersonProfileCreationDto): Promise<ProfileDto>;
   verifyPhoneNumber(user:any, phoneNumber:string, otp:string): Promise<void>;
   requestPhoneVerificationOtp(user:any, phoneNumber:string): Promise<void>;
}
