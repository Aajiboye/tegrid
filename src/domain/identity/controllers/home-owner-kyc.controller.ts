import { Controller, Get, Post, UseGuards, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ApiResponse } from '@nestjs/swagger';
import { adaptResponse } from '../../../shared/adapters/response.adapter';
import { HomeOwnerKycService } from '../services/home-owner-kyc.service';
import { BaseKycService } from '../services/base-kyc.service';
import { user } from 'src/decorators/user.decorator';
import { HomeOwner } from '../models/home-owner-user.model';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { RequireUserType } from '../../../decorators/require-user-type.decorator';
import { UserType } from '../enums/user-types.enum';
import {
    HomeOwnerAddressVerificationDto,
    HomeOwnerIdentityVerificationDto,
    HomeOwnerKycRejectionDto,
    HomeOwnerProfileCreationDto,
    HomeOwnerKycStatusResponse,
    HomeOwnerProfileDto,
    HomeOwnerPhoneRequestDto,
    HomeOwnerPhoneVerifyDto,
} from '../dtos/homeowner.kyc.dto';
import { UserTypeGuard } from '../../../guards/user-type.guard';

@ApiTags('Home Owner KYC')
@Controller('v1/home-owner-kyc')
@UseGuards(AuthGuard, UserTypeGuard)
@RequireUserType(UserType.HomeOwner)
export class HomeOwnerKycController {
    constructor(
        private readonly homeOwnerKycService: HomeOwnerKycService,
        private readonly baseKycService: BaseKycService
    ) { }

    @Get('/status')
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Get Home Owner KYC Profile Status' })
    @ApiResponse({ description: 'KYC status', type: HomeOwnerKycStatusResponse })
    async getStatus(@user() user: HomeOwner) {
        const res = await this.homeOwnerKycService.getKycStatus(user);
        return adaptResponse(res);
    }

    @Post('/profile')
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Create or Update Home Owner KYC Profile' })
    @ApiResponse({ description: 'Profile created or updated', type: HomeOwnerProfileDto })
    async createOrUpdateProfile(@user() user: HomeOwner, @Body() payload: HomeOwnerProfileCreationDto) {
        const res = await this.baseKycService.completeProfile(user, payload);
        return adaptResponse(res, "Profile created/updated successfully");
    }

    @Post('/verify-phone')
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Verify Home Owner Phone Number' })
    @ApiResponse({ description: 'Phone verification result', type: Object })
    @ApiBody({ type: HomeOwnerPhoneVerifyDto })
    async verifyPhoneNumber(@user() user: HomeOwner, @Body() payload: HomeOwnerPhoneVerifyDto) {
        const { phoneNumber, otp } = payload;
        await this.baseKycService.verifyPhoneNumber(user, phoneNumber, otp);
        return adaptResponse(null, "Phone number verified successfully");
    }

    @Post('/request-phone-otp')
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Request OTP for Home Owner Phone Number Verification' })
    @ApiResponse({ description: 'OTP requested', type: Object })
    @ApiBody({ type: HomeOwnerPhoneRequestDto })
    async requestPhoneVerificationOtp(@user() user: HomeOwner, @Body() payload: HomeOwnerPhoneRequestDto) {
        const { phoneNumber } = payload;
        await this.baseKycService.requestPhoneVerificationOtp(user, phoneNumber);
        return adaptResponse(null, "OTP sent successfully");
    }

    @Post('/complete-identity-verification')
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Complete Home Owner Identity Verification' })
    @ApiResponse({ description: 'Identity verified', type: HomeOwnerProfileDto })
    async completeIdentityVerification(@user() user: HomeOwner, @Body() payload: HomeOwnerIdentityVerificationDto) {
        const { identityType, identityData, photoIdUrl } = payload;
        const res = await this.homeOwnerKycService.completeIdentityVerification(user, identityType, identityData, photoIdUrl);
        return adaptResponse(res, "Identity verification completed successfully");
    }

    @Post('/complete-address-verification')
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Complete Home Owner Address Verification' })
    @ApiResponse({ description: 'Address verified', type: HomeOwnerProfileDto })
    async completeAddressVerification(@user() user: HomeOwner, @Body() payload: HomeOwnerAddressVerificationDto) {
        const { homeAddress, addressProofUrl } = payload;
        const res = await this.homeOwnerKycService.completeAddressVerification(user, homeAddress, addressProofUrl);
        return adaptResponse(res, "Address verification completed successfully");
    }

    @Get()
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Get Home Owner KYC Profile' })
    @ApiResponse({ description: 'KYC profile', type: HomeOwnerProfileDto })
    async getProfile(@user() user: HomeOwner) {
        const res = await this.homeOwnerKycService.getKycProfile(user);
        return adaptResponse(res);
    }

    // Admin endpoints
    @Post('/admin/:id/approve')
    @ApiBearerAuth()
    @UseGuards(AuthGuard, RoleGuard)
    @ApiOperation({ summary: 'Admin: Approve a Home Owner KYC' })
    @ApiResponse({ description: 'KYC approved', type: HomeOwnerProfileDto })
    async approveKyc(@user() user: HomeOwner, @Param('id') id: string) {
        const res = await this.homeOwnerKycService.approveKyc(id, user._id.toString());
        return adaptResponse(res, 'KYC approved');
    }

    @Post('/admin/:id/reject')
    @ApiBearerAuth()
    @UseGuards(AuthGuard, RoleGuard)
    @ApiOperation({ summary: 'Admin: Reject a Home Owner KYC' })
    @ApiResponse({ description: 'KYC rejected', type: HomeOwnerProfileDto })
    async rejectKyc(@user() user: HomeOwner, @Param('id') id: string, @Body() payload: HomeOwnerKycRejectionDto) {
        const res = await this.homeOwnerKycService.rejectKyc(id, user._id.toString(), payload.reason);
        return adaptResponse(res, 'KYC rejected');
    }
}