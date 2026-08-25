import { HomeOwnerProfileDto } from "../dtos/homeowner.kyc.dto";
import { HomeOwner } from "../models/home-owner-user.model";

export interface IHomeOwnerKyc {
   completeIdentityVerification(user:HomeOwner, identityType:string, identityData:string, photoIdUrl?:string): Promise<HomeOwnerProfileDto>;
   getDecryptedIdentityData(user:HomeOwner, encryptionKey?:string): Promise<string | null>;
   completeAddressVerification(user:HomeOwner, address:string, addressProofUrl:string): Promise<HomeOwnerProfileDto>;
   getKycProfile(user:HomeOwner): Promise<HomeOwnerProfileDto>;
}
