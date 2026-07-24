import {
  Injectable,
} from '@nestjs/common';
import { TokenRepository } from '../repositories/token.repo';
import { OTPUtilService } from '../../../shared/utils/otp.utils';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BaseAuthService{
  private readonly appEnv: string;
  constructor(
    protected readonly tokenRepo: TokenRepository,
    protected readonly otpUtil: OTPUtilService,
    protected readonly configService: ConfigService,
  ) {
    this.appEnv = this.configService.getOrThrow<string>('APP_ENV');
  }


  async requestOtp(userId: string, tokenType: string): Promise<string> {
    const { otp, expirationTime } = this.otpUtil.generateOTP(this.appEnv == 'development');
    const token = {
      tokenType,
      userId: userId,
      expiresAt: expirationTime,
      otp,
    };
    await this.tokenRepo.updateWithUpsert(
      {
        tokenType,
        userId: userId,
      },
      token,
    );
    return otp;
  }
}
