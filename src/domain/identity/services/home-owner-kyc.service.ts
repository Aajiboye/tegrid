import {
    BadRequestException,
    Injectable,
} from '@nestjs/common';
import { HomeOwnerRepository } from '../repositories/user.repo';
import { TokenRepository } from '../repositories/token.repo';
import { HomeOwner } from '../models/home-owner-user.model';
import { PasswordUtilService } from '../../../shared/utils/password.util';
import { OTPUtilService } from '../../../shared/utils/otp.utils';
import { ConfigService } from '@nestjs/config';
import { IHomeOwnerKyc } from '../interfaces/IHomeOwnerKyc';
import { HomeOwnerKycStatusResponse, HomeOwnerProfileCreationDto, HomeOwnerProfileDto } from '../dtos/homeowner.kyc.dto';
import { BaseAuthService } from './base.auth.service';
import { HomeOwnerKycProfile } from '../models/homeowner-kyc.model';
import mongoose from 'mongoose';
import { CryptoService } from '../../../shared/services/crypto.service';
import { Inject } from '@nestjs/common';
import { IDENTITY_VERIFIER } from '../providers/constants';
import { IIdentityVerifier } from '../providers/IIdentityVerifier';
import { HomeOwnerKycRepository } from '../repositories/homeowner-kyc.repo';
import { AuditService } from '../../../shared/services/audit.service';

@Injectable()
export class HomeOwnerKycService extends BaseAuthService implements IHomeOwnerKyc {
    constructor(
        private readonly homeOwnerKycRepo: HomeOwnerKycRepository,
        private readonly userRepo: HomeOwnerRepository,
        private readonly passwordUtil: PasswordUtilService,
        private readonly cryptoService: CryptoService,
        @Inject(IDENTITY_VERIFIER) private readonly identityVerifier: IIdentityVerifier,
        private readonly auditService: AuditService,
        tokenRepo: TokenRepository,
        otpUtil: OTPUtilService,
        configService: ConfigService,
    ) {
        super(tokenRepo, otpUtil, configService);
    }
    async getKycProfile(user: HomeOwner): Promise<HomeOwnerProfileDto> {
        const profile = await this.homeOwnerKycRepo.findOne({ user: new mongoose.Types.ObjectId(user._id) });
        if (!profile) {
            throw new BadRequestException('KYC profile not found');
        }
        return {
            _id: profile._id.toString(),
            firstName: profile.firstName,
            lastName: profile.lastName,
            middleName: profile.middleName,
            phoneNumber: profile.phoneNumber,
            photoIdUrl: profile.photoIdUrl,
            address: profile.address,
            addressProofUrl: profile.addressProofUrl,
            status: profile.status,
            reasonForRejection: profile.status === 'REJECTED' ? profile.rejectionReason : null,
        };
    }

    async getKycStatus(user: HomeOwner): Promise<HomeOwnerKycStatusResponse> {
        const profile = await this.homeOwnerKycRepo.findOne({ user: new mongoose.Types.ObjectId(user._id) }) || {};
        const profileItemsList = ["firstName", "lastName", "middleName", "phoneNumber", "pinHash"];
        const identityItemsList = ["identityType", "identityData", "photoIdUrl"];
        const addressVerificationItemsList = ["address", "addressProofUrl"];
        return {
            profileCompleted: profileItemsList.every(item => !!profile[item]),
            identityCompleted: identityItemsList.every(item => !!profile[item]),
            addressVerificationCompleted: addressVerificationItemsList.every(item => !!profile[item]),
        }
    }

    private async ensureKycCompleted(profileId: string) {
        const profile = await this.homeOwnerKycRepo.findById(profileId);
        if (!profile) throw new BadRequestException('KYC profile not found');
    const profileItemsList = ["firstName", "lastName", "middleName", "phoneNumber", "pinHash"];
    const identityItemsList = ["identityType", "identityData", "photoIdUrl"];
        const addressVerificationItemsList = ["address", "addressProofUrl"];

        const profileCompleted = profileItemsList.every(item => !!(profile as any)[item]);
        const identityCompleted = identityItemsList.every(item => !!(profile as any)[item]);
        const addressCompleted = addressVerificationItemsList.every(item => !!(profile as any)[item]);

        if (!profileCompleted || !identityCompleted || !addressCompleted) {
            throw new BadRequestException('All KYC steps must be completed by the user before approval');
        }

        return profile;
    }

    async approveKyc(profileId: string, adminUserId: string) {
        const profile = await this.ensureKycCompleted(profileId);
        const updated = await this.homeOwnerKycRepo.approveById(profileId, adminUserId);
        await this.auditService.log('KYC_APPROVED', adminUserId, { profileId }, `Approved KYC for ${profileId}`);
        return updated;
    }

    async rejectKyc(profileId: string, adminUserId: string, reason: string) {
        if (!reason || reason.trim() === '') throw new BadRequestException('Rejection reason is required');
        const profile = await this.homeOwnerKycRepo.findById(profileId);
        if (!profile) throw new BadRequestException('KYC profile not found');
        const updated = await this.homeOwnerKycRepo.rejectById(profileId, adminUserId, reason);
        await this.auditService.log('KYC_REJECTED', adminUserId, { profileId, reason }, `Rejected KYC for ${profileId}: ${reason}`);
        return updated;
    }

    async completeIdentityVerification(user: HomeOwner, identityType: string, identityData: string, photoIdUrl?: string): Promise<HomeOwnerProfileDto> {
        // verify via external provider before persisting (if a provider supports it)
        let verification;
        if (this.identityVerifier.verifyIdentity) {
            verification = await this.identityVerifier.verifyIdentity(identityType, identityData);
        } else if (this.identityVerifier.verifyNin) {
            // backwards compatibility: delegate to verifyNin when provider only supports NIN
            verification = await this.identityVerifier.verifyNin(identityData);
        }

        if (verification && !verification.success) {
            throw new BadRequestException(`${identityType} verification failed`);
        }

        // encrypt identity data before persisting
        const encrypted = this.cryptoService.encrypt(identityData, this.configService.get<string>('NIN_ENCRYPTION_KEY'));
        const profile: HomeOwnerKycProfile = await this.homeOwnerKycRepo.findOne({ user: new mongoose.Types.ObjectId(user._id) }) || {};
        profile.identityType = identityType;
        profile.identityData = encrypted;
        if (photoIdUrl) profile.photoIdUrl = photoIdUrl;
        const saved = await this.homeOwnerKycRepo.updateWithUpsert({ user: new mongoose.Types.ObjectId(user._id) }, profile);

        // return profile data (do not include decrypted identity data here for safety)
        return {
            _id: saved._id.toString(),
            firstName: saved.firstName,
            lastName: saved.lastName,
            middleName: saved.middleName,
            phoneNumber: saved.phoneNumber,
            photoIdUrl: saved.photoIdUrl,
            address: saved.address,
            addressProofUrl: saved.addressProofUrl,
        };
    }

    /**
     * Same as completeIdentityVerification but allows caller to supply a specific encryption key (hex or base64).
     * This makes the KYC flow flexible for other sensitive fields if needed.
     */
    async completeIdentityVerificationWithKey(user: HomeOwner, identityType: string, identityData: string, photoIdUrl?: string, encryptionKey?: string): Promise<HomeOwnerProfileDto> {
        const encrypted = this.cryptoService.encrypt(identityData, encryptionKey);
        const profile: HomeOwnerKycProfile = { user, identityType: identityType, identityData: encrypted, photoIdUrl } as any;
        const saved = await this.homeOwnerKycRepo.updateWithUpsert({ user: new mongoose.Types.ObjectId(user._id) }, profile);

        return {
            _id: saved._id.toString(),
            firstName: saved.firstName,
            lastName: saved.lastName,
            middleName: saved.middleName,
            phoneNumber: saved.phoneNumber,
            photoIdUrl: saved.photoIdUrl,
            address: saved.address,
            addressProofUrl: saved.addressProofUrl,
        };
    }

    /**
     * Return the decrypted NIN for an authorised caller. Caller must provide the key if a non-default key was used.
     */
    async getDecryptedIdentityData(user: HomeOwner, encryptionKey?: string): Promise<string | null> {
        const profile = await this.homeOwnerKycRepo.findOne({ user: new mongoose.Types.ObjectId(user._id) });
        if (!profile || !profile.identityData) return null;
        return this.cryptoService.decrypt(profile.identityData, encryptionKey);
    }

    async completeAddressVerification(user: HomeOwner, address: string, addressProofUrl: string): Promise<HomeOwnerProfileDto> {
        const profile: HomeOwnerKycProfile = { address, addressProofUrl };
        const saved = await this.homeOwnerKycRepo.updateWithUpsert({ user: new mongoose.Types.ObjectId(user._id) }, profile);
        return {
            _id: saved._id.toString(),
            firstName: saved.firstName,
            lastName: saved.lastName,
            middleName: saved.middleName,
            phoneNumber: saved.phoneNumber,
            photoIdUrl: saved.photoIdUrl,
            address: saved.address,
            addressProofUrl: saved.addressProofUrl,
        };
    }


}
