import { Controller, Get, Post, UseGuards, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { adaptResponse } from '../../../shared/adapters/response.adapter';
import { HomeOwnerKycService } from '../services/home-owner-kyc.service';
import { user } from 'src/decorators/user.decorator';
import { User } from '../models/user.model';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { HomeOwnerAddressVerificationDto, HomeOwnerIdentityVerificationDto, HomeOwnerKycRejectionDto, HomeOwnerProfileCreationDto } from '../dtos/homeowner.kyc.dto';

@ApiTags('Home Owner KYC')
@Controller('v1/home-owner-kyc')
export class HomeOwnerKycController {
    constructor(private readonly homeOwnerKycService: HomeOwnerKycService) { }

    @Get('/status')
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Get Home Owner KYC Profile Status' })
    async getStatus(@user() user: User) {
        const res = await this.homeOwnerKycService.getKycStatus(user);
        return adaptResponse(res);
    }

    @Post('/profile')
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Create or Update Home Owner KYC Profile' })
    async createOrUpdateProfile(@user() user: User, @Body() payload: HomeOwnerProfileCreationDto) {
        const res = await this.homeOwnerKycService.completeProfile(user, payload);
        return adaptResponse(res, "Profile created/updated successfully");
    }

    @Post('/verify-phone')
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Verify Home Owner Phone Number' })
    async verifyPhoneNumber(@user() user: User, @Body() payload: { phoneNumber: string, otp: string }) {
        const { phoneNumber, otp } = payload;
        await this.homeOwnerKycService.verifyPhoneNumber(user, phoneNumber, otp);
        return adaptResponse(null, "Phone number verified successfully");
    }

    @Post('/request-phone-otp')
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Request OTP for Home Owner Phone Number Verification' })
    async requestPhoneVerificationOtp(@user() user: User, @Body() payload: { phoneNumber: string }) {
        const { phoneNumber } = payload;
        await this.homeOwnerKycService.requestPhoneVerificationOtp(user, phoneNumber);
        return adaptResponse(null, "OTP sent successfully");
    }

    @Post('/complete-identity-verification')
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Complete Home Owner Identity Verification' })
    async completeIdentityVerification(@user() user: User, @Body() payload: HomeOwnerIdentityVerificationDto) {
        const { nin, photoIdUrl } = payload;
        const res = await this.homeOwnerKycService.completeIdentityVerification(user, nin, photoIdUrl);
        return adaptResponse(res, "Identity verification completed successfully");
    }

    @Post('/complete-address-verification')
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Complete Home Owner Address Verification' })
    async completeAddressVerification(@user() user: User, @Body() payload: HomeOwnerAddressVerificationDto) {
        const { homeAddress, addressProofUrl } = payload;
        const res = await this.homeOwnerKycService.completeAddressVerification(user, homeAddress, addressProofUrl);
        return adaptResponse(res, "Address verification completed successfully");
    }

    @Get()
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Get Home Owner KYC Profile' })
    async getProfile(@user() user: User) {
        const res = await this.homeOwnerKycService.getKycProfile(user);
        return adaptResponse(res);
    }

    // Admin endpoints
    @Post('/admin/:id/approve')
    @ApiBearerAuth()
    @UseGuards(AuthGuard, RoleGuard)
    @ApiOperation({ summary: 'Admin: Approve a Home Owner KYC' })
    async approveKyc(@user() user: User, @Param('id') id: string) {
        const res = await this.homeOwnerKycService.approveKyc(id, user._id.toString());
        return adaptResponse(res, 'KYC approved');
    }

    @Post('/admin/:id/reject')
    @ApiBearerAuth()
    @UseGuards(AuthGuard, RoleGuard)
    @ApiOperation({ summary: 'Admin: Reject a Home Owner KYC' })
    async rejectKyc(@user() user: User, @Param('id') id: string, @Body() payload: HomeOwnerKycRejectionDto) {
        const res = await this.homeOwnerKycService.rejectKyc(id, user._id.toString(), payload.reason);
        return adaptResponse(res, 'KYC rejected');
    }
}