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
import { BaseAuthService } from './base.auth.service';
import mongoose from 'mongoose';
import { Inject } from '@nestjs/common';
import { IDENTITY_VERIFIER } from '../providers/constants';
import { IIdentityVerifier } from '../providers/IIdentityVerifier';
import { HomeOwnerKycRepository } from '../repositories/homeowner-kyc.repo';
import { TradePersonUserRepository } from '../repositories/trade-person-user.repo';
import { UserType } from '../enums/user-types.enum';
import { IBaseKyc } from '../interfaces/IBaseKyc';
import { ProfileCreationDto, ProfileDto } from '../dtos/kyc.dto';
import { TradePersonProfileCreationDto } from '../dtos/tradeperson.kyc.dto';
import { TradePerson } from '../models/trade-person-user.model';
import { TradePersonKycRepository } from '../repositories/trade-person-kyc.repo';

@Injectable()
export class BaseKycService extends BaseAuthService implements IBaseKyc {
    constructor(
        private readonly homeOwnerKycRepo: HomeOwnerKycRepository,
        private readonly tradePersonKycRepo: TradePersonKycRepository,
        private readonly homeOwnerRepo: HomeOwnerRepository,
        private readonly tradePersonRepo: TradePersonUserRepository,
        private readonly passwordUtil: PasswordUtilService,
        @Inject(IDENTITY_VERIFIER) private readonly identityVerifier: IIdentityVerifier,
        tokenRepo: TokenRepository,
        otpUtil: OTPUtilService,
        configService: ConfigService,
    ) {
        super(tokenRepo, otpUtil, configService);
    }

    // Return the appropriate KYC repository (homeowner vs tradeperson) based on user context
    private getKycRepoForUser(user: HomeOwner|TradePerson) {
        const type = user?.userType;
        if (type === UserType.TRADESPERSON) return this.tradePersonKycRepo;
        return this.homeOwnerKycRepo;
    }

    // Return the appropriate User repository (homeowner vs tradeperson) based on user context
    private getUserRepoForUser(user: HomeOwner|TradePerson) {
        const type = user?.userType;
        if (type === UserType.TRADESPERSON) return this.tradePersonRepo;
        return this.homeOwnerRepo;
    }

    async completeProfile(user: HomeOwner|TradePerson, profileData: ProfileCreationDto | TradePersonProfileCreationDto): Promise<ProfileDto> {
        const userRepo = this.getUserRepoForUser(user);
        const userData = await userRepo.findOne({ _id: user._id });
        if (userData && userData.phoneNumber) profileData.phoneNumber = userData.phoneNumber;
        await this.isPhoneNumberVerified(userData);

        const profilePayload: any = { ...profileData };
        profilePayload.pinHash = await this.passwordUtil.hashPassword(profileData.pin);

        const kycRepo = this.getKycRepoForUser(user);
        const saved = await kycRepo.updateWithUpsert({ user: new mongoose.Types.ObjectId(user._id) }, profilePayload);

        const s: any = saved as any;
        return {
            _id: s._id?.toString(),
            firstName: s.firstName,
            lastName: s.lastName,
            middleName: s.middleName,
            phoneNumber: s.phoneNumber,
            photoIdUrl: s.photoIdUrl,
            address: s.address,
            addressProofUrl: s.addressProofUrl,
        };
    }

    async verifyPhoneNumber(user: HomeOwner|TradePerson, phoneNumber: string, otp: string): Promise<void> {
        const query = {
            tokenType: 'PHONE_VERIFICATION',
            otp,
            userId: phoneNumber,
            expiresAt: { $gte: Date.now() },
        }

        const token = await this.tokenRepo.findOne(query);

        if (!token) throw new BadRequestException("OTP expired or doesn't exist");

        const userRepo = this.getUserRepoForUser(user);
        const userData = await userRepo.findOne({ _id: user._id });
        const kycRepo = this.getKycRepoForUser(user);
        const profile: any = { user: userData, phoneNumber, status: 'PENDING' };
        await kycRepo.save(profile);

        this.tokenRepo.deleteById(token._id.toString());
    }

    async requestPhoneVerificationOtp(user: HomeOwner|TradePerson, phoneNumber: string): Promise<void> {
        const kycRepo = this.getKycRepoForUser(user);
        const userProfile = await kycRepo.findOne({ phoneNumber });
        if (userProfile) throw new BadRequestException('Phone number already in use');
        await this.requestOtp(phoneNumber, 'PHONE_VERIFICATION');
    }

    async isPhoneNumberVerified(user: HomeOwner|TradePerson): Promise<void> {
        const kycRepo = this.getKycRepoForUser(user);
        const phoneNumberVerification = await kycRepo.findOne({ user: new mongoose.Types.ObjectId(user._id) });
        if (!phoneNumberVerification || !phoneNumberVerification.phoneNumber) {
            throw new BadRequestException('Phone number not verified');
        }
    }


}
