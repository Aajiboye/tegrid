import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { IAuth } from '../interfaces/IAuth';
import {
    LoginPayload,
    LoginResponse,
    SignUpResponse,
    ResetPasswordPayload,
    VerifyEmailPayload,
    VerifyEmailResponse,
    UserSignUpPayLoad,
    UserNameExistenceResponse,
    ForgotPasswordDto,
} from '../dtos/auth.payload.dto';
import { UserRepository } from '../repositories/user.repo';
import { TokenService } from '../../../shared/services/token.service';
import { DuplicateUserError } from '../../../shared/errors';
import { TokenRepository } from '../repositories/token.repo';
import { User } from '../models/user.model';
import { Role } from '../enums/roles.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailUtilService } from '../../../shared/utils/email.util';
import { PasswordUtilService } from '../../../shared/utils/password.util';
import { OTPUtilService } from '../../../shared/utils/otp.utils';
import { PhoneUtilService } from '../../../shared/utils/phone.utils';
import { ConfigService } from '@nestjs/config';
import { UserType } from '../enums/user-types.enum';
import { IHomeOwnerKyc } from '../interfaces/IHomeOwnerKyc';
import { HomeOwnerKycStatusResponse, HomeOwnerProfileCreationDto, HomeOwnerProfileDto } from '../dtos/homeowner.kyc.dto';
import { HomeOwnerKycRepository } from '../repositories/homeowner-kyc.repo';
import { BaseAuthService } from './base.auth.service';
import { PhoneNumberVerificationRepository } from '../repositories/phone-verification.repo';
import { HomeOwnerKycProfile } from '../models/homeowner-kyc.model';

@Injectable()
export class HomeOwnerKycService extends BaseAuthService implements IHomeOwnerKyc {
    constructor(
        private readonly homeOwnerKycRepo: HomeOwnerKycRepository,
        private readonly userRepo: UserRepository,
        private readonly phoneNumberVerificationRepo: PhoneNumberVerificationRepository,
        tokenRepo: TokenRepository,
        otpUtil: OTPUtilService,
        configService: ConfigService,
    ) {
        super(tokenRepo, otpUtil, configService);
    }
    async getKycStatus(user: User): Promise<HomeOwnerKycStatusResponse> {
        const profile = await this.homeOwnerKycRepo.findOne({ user }) || {};
        const profileItemsList = ["firstName", "lastName", "middleName", "phoneNumber", "pin"];
        const identityItemsList = ["nin", "photoIdUrl"];
        const addressVerificationItemsList = ["address", "addressProofUrl"];
        return {
            profileItemsCompleted: profileItemsList.filter(item => profile[item]).length,
            totalProfileItems: profileItemsList.length,
            identityItemsCompleted: identityItemsList.filter(item => profile[item]).length,
            totalIdentityItems: identityItemsList.length,
            addressVerificationCompleted: addressVerificationItemsList.filter(item => profile[item]).length,
            totalAddressVerificationItems: addressVerificationItemsList.length,
        }
    }

    async completeProfile(user: User, profileData: HomeOwnerProfileCreationDto): Promise<HomeOwnerProfileDto> {
        const profile = { ...profileData };
        const userData = await this.userRepo.findOne({ id: user._id });
        if (userData.phoneNumber) profile.phoneNumber = userData.phoneNumber;
        else await this.isPhoneNumberVerified(userData);
        
        return this.homeOwnerKycRepo.updateWithUpsert({ user }, profile);
    }

    async verifyPhoneNumber(user: User, phoneNumber: string, otp: string): Promise<void> {
        const query = {
            tokenType: 'PHONE_VERIFICATION',
            otp,
            expiresAt: { $gte: Date.now() },
        }

        const token = await this.tokenRepo.findOne(query);

        if (!token) throw new BadRequestException("OTP expired or doesn't exist");

        const userData = await this.userRepo.findOne({ id: user._id });

        const kyc = new HomeOwnerKycProfile();
        kyc.phoneNumber = phoneNumber;
        kyc.user = userData;
        this.homeOwnerKycRepo.save(kyc);
    }

    async requestPhoneVerificationOtp(user: User, phoneNumber: string): Promise<void> {
        const userProfile = await this.homeOwnerKycRepo.findOne({ phoneNumber });
        if (userProfile) throw new BadRequestException('Phone number already in use');
        await this.requestOtp(phoneNumber, 'PHONE_VERIFICATION');
    }

    async isPhoneNumberVerified(user: User): Promise<void> {
        const phoneNumberVerification = await this.homeOwnerKycRepo.findOne({ user });
        if (!phoneNumberVerification || !phoneNumberVerification.phoneNumber) {
            throw new BadRequestException('Phone number not verified');
        }

    }



}
