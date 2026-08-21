import {
    BadRequestException,
    Injectable,
} from '@nestjs/common';
import { TokenRepository } from '../repositories/token.repo';
import { PasswordUtilService } from '../../../shared/utils/password.util';
import { OTPUtilService } from '../../../shared/utils/otp.utils';
import { ConfigService } from '@nestjs/config';
import { TradePersonIdentityVerificationDto, TradePersonKycStatusResponse, TradePersonProfileDto } from '../dtos/tradeperson.kyc.dto';
import { BaseAuthService } from './base.auth.service';
import mongoose from 'mongoose';
import { CryptoService } from '../../../shared/services/crypto.service';
import { Inject } from '@nestjs/common';
import { IDENTITY_VERIFIER } from '../providers/constants';
import { IIdentityVerifier } from '../providers/IIdentityVerifier';
import { TradePersonUserRepository } from '../repositories/trade-person-user.repo';
import { AuditService } from '../../../shared/services/audit.service';
import { ITradePersonKyc } from '../interfaces/ITradePersonKyc';
import { TradePerson } from '../models/trade-person-user.model';
import { TradePersonKycRepository } from '../repositories/trade-person-kyc.repo';

@Injectable()
export class TradePersonKycService extends BaseAuthService implements ITradePersonKyc {
    constructor(
        private readonly tradePersonKycRepo: TradePersonKycRepository,
        private readonly userRepo: TradePersonUserRepository,
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

    private mapProfileToDto(profile: any): TradePersonProfileDto {
        return {
            _id: profile._id.toString(),
            firstName: profile.firstName,
            lastName: profile.lastName,
            phoneNumber: profile.phoneNumber,
            photoIdUrl: profile.photoIdUrl,
            addressProofUrl: profile.addressProofUrl,
            dob: profile.dob,
            homeAddress: profile.homeAddress,
            healthAndSafetyCertificateUrl: profile.healthAndSafetyCertificateUrl,
            policeCharacterReportUrl: profile.policeCharacterReportUrl,
            bankName: profile.bankName,
            accountNumber: profile.accountNumber,
            accountName: profile.accountName,
            mainTradeUrl: profile.mainTrade,
            status: profile.status,
            reasonForRejection: profile.status === 'REJECTED' ? profile.rejectionReason : null,
        };
    }

    async getKycProfile(user: TradePerson): Promise<TradePersonProfileDto> {
        const profile = await this.tradePersonKycRepo.findOne({ user: new mongoose.Types.ObjectId(user._id) });
        if (!profile) {
            throw new BadRequestException('KYC profile not found');
        }
        return this.mapProfileToDto(profile);
    }

    async getKycStatus(user: TradePerson): Promise<TradePersonKycStatusResponse> {
        const profile = await this.tradePersonKycRepo.findOne({ user: new mongoose.Types.ObjectId(user._id) }) || {};
        const profileItemsList = ["firstName", "lastName", "phoneNumber", "pinHash"];
        const personalInfoList = ["dob", "homeAddress"];
        const identityItemsList = ["identityType", "identityData", "photoIdUrl", "addressProofUrl"];
        const healthAndSafetyComplianceItemsList = ["healthAndSafetyCertificateUrl"];
        const policeCharacterReportItemsList = ["policeCharacterReportUrl"];
        const bankDetailsItemsList = ["bankName", "accountNumber", "accountName"];
        const mainTradeItemsList = ["mainTrade"];
        return {
            profileCompleted: profileItemsList.every(item => !!profile[item]),
            personalInformationCompleted: personalInfoList.every(item => !!profile[item]),
            identityCompleted: identityItemsList.every(item => !!profile[item]),
            healthAndSafetyComplianceCompleted: healthAndSafetyComplianceItemsList.every(item => !!profile[item]),
            policeCharacterReportCompleted: policeCharacterReportItemsList.every(item => !!profile[item]),
            bankDetailsCompleted: bankDetailsItemsList.every(item => !!profile[item]),
            mainTradeCompleted: mainTradeItemsList.every(item => !!profile[item]),
        }
    }

    private async ensureKycCompleted(profileId: string) {
        const profile = await this.tradePersonKycRepo.findById(profileId);
        if (!profile) throw new BadRequestException('KYC profile not found');
        const profileItemsList = ["businessName", "contactName", "phoneNumber", "pinHash"];
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
        const updated = await this.tradePersonKycRepo.approveById(profileId, adminUserId);
        await this.auditService.log('KYC_APPROVED', adminUserId, { profileId }, `Approved KYC for ${profileId}`);
        return updated;
    }

    async rejectKyc(profileId: string, adminUserId: string, reason: string) {
        if (!reason || reason.trim() === '') throw new BadRequestException('Rejection reason is required');
        const profile = await this.tradePersonKycRepo.findById(profileId);
        if (!profile) throw new BadRequestException('KYC profile not found');
        const updated = await this.tradePersonKycRepo.rejectById(profileId, adminUserId, reason);
        await this.auditService.log('KYC_REJECTED', adminUserId, { profileId, reason }, `Rejected KYC for ${profileId}: ${reason}`);
        return updated;
    }

    async completeIdentityVerification(user: TradePerson, payload: TradePersonIdentityVerificationDto): Promise<TradePersonProfileDto> {
        const { identityType, identityData, photoIdUrl, addressProofUrl } = payload;
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
        const profile: any = await this.tradePersonKycRepo.findOne({ user: new mongoose.Types.ObjectId(user._id) }) || {};
        profile.identityType = identityType;
        profile.identityData = encrypted;
        profile.addressProofUrl = addressProofUrl;
        if (photoIdUrl) profile.photoIdUrl = photoIdUrl;
        const saved = await this.tradePersonKycRepo.updateWithUpsert({ user: new mongoose.Types.ObjectId(user._id) }, profile);

        // return profile data (do not include decrypted identity data here for safety)
        return this.mapProfileToDto(saved);
    }

    /**
     * Return the decrypted identity data for an authorised caller.
     */
    async getDecryptedIdentityData(user: TradePerson, encryptionKey?: string): Promise<string | null> {
        const profile = await this.tradePersonKycRepo.findOne({ user: new mongoose.Types.ObjectId(user._id) });
        if (!profile || !profile.identityData) return null;
        return this.cryptoService.decrypt(profile.identityData, encryptionKey);
    }

    async completeAddressVerification(user: TradePerson, address: string, addressProofUrl: string): Promise<TradePersonProfileDto> {
        const profile: any = { address, addressProofUrl };
        const saved = await this.tradePersonKycRepo.updateWithUpsert({ user: new mongoose.Types.ObjectId(user._id) }, profile);
        return this.mapProfileToDto(saved);
    }

    async completePersonalInformation(user: TradePerson, personalInfoDto: any): Promise<any> {
        const profile: any = { ...personalInfoDto };
        const saved = await this.tradePersonKycRepo.updateWithUpsert({ user: new mongoose.Types.ObjectId(user._id) }, profile);
        return this.mapProfileToDto(saved);
    }

    async completeHealthAndSafetyCompliance(user: TradePerson, healthAndSafetyComplianceDto: any): Promise<TradePersonProfileDto> {
        const profile: any = { ...healthAndSafetyComplianceDto };
        const saved = await this.tradePersonKycRepo.updateWithUpsert({ user: new mongoose.Types.ObjectId(user._id) }, profile);
        return this.mapProfileToDto(saved);
    }

    async completePoliceCharacterReport(user: TradePerson, policeCharacterReportDto: any): Promise<any> {
        const profile: any = { ...policeCharacterReportDto };
        const saved = await this.tradePersonKycRepo.updateWithUpsert({ user: new mongoose.Types.ObjectId(user._id) }, profile);
        return this.mapProfileToDto(saved);
    }

    async completeBankDetails(user: TradePerson, bankDetailsDto: any): Promise<any> {
        const profile: any = { ...bankDetailsDto };
        // do bank account verification here
        
        const saved = await this.tradePersonKycRepo.updateWithUpsert({ user: new mongoose.Types.ObjectId(user._id) }, profile);
        return this.mapProfileToDto(saved);
    }

    async completeMainTrade(user: TradePerson, mainTradeDto: any): Promise<any> {
        const profile: any = { ...mainTradeDto };
        const saved = await this.tradePersonKycRepo.updateWithUpsert({ user: new mongoose.Types.ObjectId(user._id) }, profile);
        return this.mapProfileToDto(saved);
    }
}
