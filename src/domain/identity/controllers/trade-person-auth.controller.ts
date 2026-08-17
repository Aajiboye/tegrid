import { Controller, Post, Body, Get, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { adaptResponse } from '../../../shared/adapters/response.adapter';
import { ForgotPasswordDto, LoginPayload, LoginResponse, RequestEmailOtp, ResetPasswordPayload, SignUpResponse, UserSignUpPayLoad, VerifyEmailPayload, VerifyEmailResponse } from '../dtos/auth.payload.dto';
import { TradePersonAuthService } from '../services/trade-person-auth.service';

@ApiTags('TradePerson Onboarding')
@Controller('v1/tradeperson/auth')
export class TradePersonAuthController {
    constructor(private readonly service: TradePersonAuthService) { }



    @HttpCode(HttpStatus.OK)
    @Post('login')
    @ApiResponse({ type: LoginResponse })
    async login(@Body() payload: LoginPayload) {
        return adaptResponse(await this.service.login(payload));
    }

    @HttpCode(HttpStatus.CREATED)
    @Post('complete-profile')
    @ApiResponse({ type: SignUpResponse })
    async signUp(@Body() payload: UserSignUpPayLoad) {
        return adaptResponse(await this.service.completeProfile(payload));
    }

    @HttpCode(HttpStatus.OK)
    @Post('/email/verify')
    @ApiResponse({ type: VerifyEmailResponse })
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
