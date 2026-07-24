import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import {
  ForgotPasswordDto,
  LoginPayload,
  RequestEmailOtp,
  ResetPasswordPayload,
  UserSignUpPayLoad,
  VerifyEmailPayload,
} from '../dtos/auth.payload.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { adaptResponse } from '../../../shared/adapters/response.adapter';

@ApiTags('Auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() payload: LoginPayload, @Param('entity') entity: string) {
    return adaptResponse(await this.service.login(payload));
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('complete-profile')
  async signUp(@Body() payload: UserSignUpPayLoad) {
    return adaptResponse(await this.service.completeProfile(payload));
  }

  @HttpCode(HttpStatus.OK)
  @Post('/email/verify')
  async verifyEmail(
    @Body() payload: VerifyEmailPayload,
  ) {
    return adaptResponse(await this.service.verifyEmail(payload), "Email verification Successful");
  }

  @HttpCode(HttpStatus.OK)
  @Post('/resend-otp')
  async resendVerificationEmail(
    @Body() payload: RequestEmailOtp,
  ) {
    return adaptResponse(await this.service
      .requestVerificationOtp(payload.identifier), "OTP resent successfully");
  }

  @HttpCode(HttpStatus.OK)
  @Post('/signup-otp')
  async requestVerificationOtp(
    @Body() payload: RequestEmailOtp,
  ) {
    return adaptResponse(await this.service
      .requestVerificationOtp(payload.identifier), "OTP sent successfully");
  }

  @HttpCode(HttpStatus.OK)
  @Post('/forgot-password')
  async forgotPassword(
    @Body() payload: ForgotPasswordDto,
  ) {
    return adaptResponse(await this.service.forgotPassword(payload), "Password reset OTP sent to email");
  }

  @HttpCode(HttpStatus.OK)
  @Post('/reset-password')
  async resetPassword(
    @Body() payload: ResetPasswordPayload,
  ) {
    return adaptResponse(await this.service.resetPassword(payload), "Password reset successful");
  }
}
