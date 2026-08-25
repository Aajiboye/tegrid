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
import { HomeOwnerRepository } from '../repositories/user.repo';
import { TokenService } from '../../../shared/services/token.service';
import { DuplicateUserError } from '../../../shared/errors';
import { TokenRepository } from '../repositories/token.repo';
import { HomeOwner } from '../models/home-owner-user.model';
import { Role } from '../enums/roles.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailUtilService } from '../../../shared/utils/email.util';
import { PasswordUtilService } from '../../../shared/utils/password.util';
import { OTPUtilService } from '../../../shared/utils/otp.utils';
import { PhoneUtilService } from '../../../shared/utils/phone.utils';
import { ConfigService } from '@nestjs/config';
import { UserType } from '../enums/user-types.enum';
import { BaseAuthService } from './base.auth.service';

@Injectable()
export class AuthService extends BaseAuthService implements IAuth {
  constructor(
    private readonly userRepo: HomeOwnerRepository,
    protected readonly tokenRepo: TokenRepository,
    private readonly emailUtil: EmailUtilService,
    private readonly passwordUtil: PasswordUtilService,
    protected readonly otpUtil: OTPUtilService,
    private readonly phoneUtil: PhoneUtilService,
    private readonly tokenService: TokenService,
    private readonly eventEmitter: EventEmitter2,
    protected readonly configService: ConfigService,
  ) {
    super(tokenRepo, otpUtil, configService);
      const appEnv = this.configService.getOrThrow<string>('APP_ENV');
  }



  async getUserNameAvailability(userName: string): Promise<UserNameExistenceResponse> {
    const normalized = (userName || '').trim();
    if (!normalized) {
      return { isTaken: false };
    }

    const user = await this.userRepo.findOne({ userName: normalized });
    return {
      isTaken: user != null,
    };
  }

  async login(_loginPayload: LoginPayload): Promise<LoginResponse> {
    const identifier = _loginPayload.identifier;
    let query = {};
    if(identifier.includes('@')) {
      query = { email: this.emailUtil.normalizeEmail(identifier) };
    } else {
      query = { phoneNumber: this.phoneUtil.normalizePhone(identifier) };
    }
    const user = await this.userRepo.findOne(query);
    if (!user) throw new UnauthorizedException('Invalid Credentials');

    // prevent login if user is soft-deleted
    if ((user as any).deletedAt) {
      throw new UnauthorizedException('Account has been deleted');
    }

    // Ensure stored password exists before comparing
    if (!user.password || !this.passwordUtil.comparePasswords(_loginPayload.password, user.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.tokenService.generateAccessToken({
      email: user.email,
      _id: user._id,
      role: user.role,
      profileAvatar: user.profileAvatar,
      userType: user.userType,
      userName: user.userName,
    });

    user.accessToken = accessToken;
    await this.userRepo.update({ _id: user._id }, user);

    return {
      _id: user._id.toString(),
      email: user.email,
      token: user.accessToken,
      verified: user.isVerified,
      userName: user.userName,
      userRole: user.role,
      profileAvatar: user.profileAvatar,
      userType: user.userType,
    };
  }
  async completeProfile(_signupPayload: UserSignUpPayLoad): Promise<SignUpResponse> {
    const identifier = _signupPayload.identifier;
    let query = {};
    if(identifier.includes('@')) {
      query = { email: this.emailUtil.normalizeEmail(identifier) };
    } else {
      query = { phoneNumber: this.phoneUtil.normalizePhone(identifier) };
    }

    let user = await this.userRepo.findOne(query);
    
    if (!user) throw new NotFoundException(`User with specified ${identifier.includes('@') ? 'email' : 'phone number'} not found`);
    
    if(user.password) throw new BadRequestException("Profile is already completed.");

    if(!user.isVerified) throw new BadRequestException(`User ${identifier.includes('@') ? 'email' : 'phone number'} is not verified`);

    user.password = this.passwordUtil.hashPassword(_signupPayload.password);
    user.profileAvatar = _signupPayload.profileAvatar;
    user.userName = _signupPayload.userName;
    user.role = Role.User
    user = await this.userRepo.save(user);
    

    return {
      userName: user.userName,
      email: user.email,
      verified: user.isVerified,
      profileAvatar: user.profileAvatar,
    };
  }

  async verifyEmail(
    verifyEmailPayload: VerifyEmailPayload,
  ): Promise<VerifyEmailResponse> {

    const identifier = verifyEmailPayload.identifier;
    let emailNormalized = '';
    let phoneNormalized = '';
    const query = {tokenType: 'ONBOARDING',
      otp: verifyEmailPayload.otp,
      expiresAt: { $gte: Date.now() },}

    if ((identifier || '').includes('@')) {
      query['userId'] = this.emailUtil.normalizeEmail(identifier);
      emailNormalized = this.emailUtil.normalizeEmail(identifier);
    } else {
      query['userId'] = this.phoneUtil.normalizePhone(identifier);
      phoneNormalized = this.phoneUtil.normalizePhone(identifier);
    }
    const token = await this.tokenRepo.findOne(query);

    if (!token) throw new BadRequestException("OTP expired or doesn't exist");

  const user = new HomeOwner();
  user.isVerified = true;
  if(emailNormalized) user.email = emailNormalized;
  if(phoneNormalized) user.phoneNumber = phoneNormalized;
    user.userType = UserType.HomeOwner;
    this.userRepo.save(user);

    this.tokenRepo.deleteById(token._id.toString());

    return { verified: user.isVerified };
  }

  // async requestOtp(userId: string, tokenType: string): Promise<string> {
  //   const { otp, expirationTime } = this.otpUtil.generateOTP();
  //   const token = {
  //     tokenType,
  //     userId: userId,
  //     expiresAt: expirationTime,
  //     otp,
  //   };
  //   await this.tokenRepo.updateWithUpsert(
  //     {
  //       tokenType,
  //       userId: userId,
  //     },
  //     token,
  //   );
  //   return otp;
  // }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const email = this.emailUtil.normalizeEmail(forgotPasswordDto.email);
    const user = await this.userRepo.findOne({ email });
    if (!user) return;

    const otp = await this.requestOtp(email, 'RESET_PASSWORD');
    this.eventEmitter.emit('Send.ForgotPassword', {
      name: user.userName,
      to: email,
      otp,
      subject: 'TradeExpertsGrid Forgot Password',
    });
  }

  async resetPassword(
    _resetPasswordPayload: ResetPasswordPayload,
  ): Promise<void> {
    const email = this.emailUtil.normalizeEmail(_resetPasswordPayload.email);
    const user = await this.userRepo.findOne({
      email,
    });
    if (!user) throw new UnauthorizedException('Invalid Credentials');

    const token = await this.tokenRepo.findOne({
      tokenType: 'RESET_PASSWORD',
      userId: user.email,
      otp: _resetPasswordPayload.otp,
      expiresAt: { $gte: Date.now() },
    });

    if (!token) throw new BadRequestException("OTP expired or doesn't exist");

    user.password = this.passwordUtil.hashPassword(_resetPasswordPayload.newPassword);
    this.userRepo.save(user);
    this.tokenRepo.deleteById(token._id.toString());
  }

  async requestVerificationOtp(identifier: string): Promise<void> {
    if ((identifier || '').includes('@')) {
      await this.requestEmailVerificationOtp(identifier);
    } else {
      await this.requestPhoneNumberVerificationOtp(identifier);
    }
  }

  async requestEmailVerificationOtp(identifier: string): Promise<void> {
    const email = this.emailUtil.normalizeEmail(identifier);
    const user = await this.userRepo.findOne({ email });
    if (user) throw new DuplicateUserError("User with the same email already exists");

    const otp = await this.requestOtp(email, 'ONBOARDING');
    this.eventEmitter.emit('Send.NewUser', {
      name: email,
      to: email,
      otp,
      subject: 'TradeExpertsGrid Email Verification',
    });
    return;
  }

    async requestPhoneNumberVerificationOtp(phoneNumber: string): Promise<void> {
    const phone = this.phoneUtil.normalizePhone(phoneNumber);
    const user = await this.userRepo.findOne({ phoneNumber: phone });
    if (user) throw new DuplicateUserError('User with the same phone number already exists');

    const otp = await this.requestOtp(phone, 'ONBOARDING');

    this.eventEmitter.emit('Send.PhoneVerification', {
      name: phone,
      to: phone,
      otp,
      subject: 'TradeExpertsGrid Phone Verification',
    });
    return;
  }
}
