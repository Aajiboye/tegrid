import { Injectable, BadRequestException } from '@nestjs/common';
import { TradePersonUserRepository } from '../repositories/trade-person-user.repo';
import { UserRepository } from '../repositories/user.repo';
import { BaseAuthService } from './base.auth.service';
import { TokenRepository } from '../repositories/token.repo';
import { OTPUtilService } from '../../../shared/utils/otp.utils';
import { ConfigService } from '@nestjs/config';
import { TradePersonProfileCreationDto, TradePersonProfileDto } from '../dtos/tradeperson.onboarding.dto';
import mongoose from 'mongoose';
import { PasswordUtilService } from '../../../shared/utils/password.util';

@Injectable()
export class TradePersonOnboardingService extends BaseAuthService {
  constructor(
    private readonly tradePersonRepo: TradePersonUserRepository,
    private readonly userRepo: UserRepository,
    private readonly passwordUtil: PasswordUtilService,
    tokenRepo: TokenRepository,
    otpUtil: OTPUtilService,
    configService: ConfigService,
  ) {
    super(tokenRepo, otpUtil, configService);
  }

  async createOrUpdateProfile(user: any, payload: TradePersonProfileCreationDto): Promise<TradePersonProfileDto> {
    const userData = await this.userRepo.findOne({ _id: user._id });
    if (userData && userData.phoneNumber) payload.phoneNumber = userData.phoneNumber;

    const profile: any = { ...payload };
    profile.pinHash = await this.passwordUtil.hashPassword(payload.pin);
    const saved = await this.tradePersonRepo.updateWithUpsert({ user: new mongoose.Types.ObjectId(user._id) }, profile);
    return {
      _id: saved._id.toString(),
      businessName: saved.businessName,
      contactName: saved.contactName,
      phoneNumber: saved.phoneNumber,
      photoIdUrl: saved.photoIdUrl,
      address: saved.address,
      addressProofUrl: saved.addressProofUrl,
      profileCompleted: saved.profileCompleted,
    };
  }

  async requestPhoneVerificationOtp(user: any, phoneNumber: string): Promise<void> {
    const profile = await this.tradePersonRepo.findOne({ phoneNumber });
    if (profile) throw new BadRequestException('Phone number already in use');
    await this.requestOtp(phoneNumber, 'ONBOARDING_TRADEPERSON');
  }

  async verifyPhoneNumber(user: any, phoneNumber: string, otp: string): Promise<void> {
    const query = {
      tokenType: 'ONBOARDING_TRADEPERSON',
      otp,
      expiresAt: { $gte: Date.now() },
    };

    const token = await this.tokenRepo.findOne(query);
    if (!token) throw new BadRequestException("OTP expired or doesn't exist");

    const profile: any = { user: new mongoose.Types.ObjectId(user._id), phoneNumber, profileCompleted: false };
    await this.tradePersonRepo.updateWithUpsert({ user: new mongoose.Types.ObjectId(user._id) }, profile);
    await this.tokenRepo.deleteById(token._id.toString());
  }

  async getProfile(user: any): Promise<TradePersonProfileDto | null> {
    const profile = await this.tradePersonRepo.findOne({ user: new mongoose.Types.ObjectId(user._id) });
    if (!profile) return null;
    return {
      _id: profile._id.toString(),
      businessName: profile.businessName,
      contactName: profile.contactName,
      phoneNumber: profile.phoneNumber,
      photoIdUrl: profile.photoIdUrl,
      address: profile.address,
      addressProofUrl: profile.addressProofUrl,
      profileCompleted: profile.profileCompleted,
    };
  }
}
