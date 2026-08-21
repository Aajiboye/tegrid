import { Controller, Get, Post, UseGuards, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ApiResponse } from '@nestjs/swagger';
import { adaptResponse } from '../../../shared/adapters/response.adapter';
import { TradePersonKycService } from '../services/trade-person-kyc.service';
import { BaseKycService } from '../services/base-kyc.service';
import { user } from 'src/decorators/user.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { UserTypeGuard } from 'src/guards/user-type.guard';
import { RequireUserType } from 'src/decorators/require-user-type.decorator';
import { UserType } from '../enums/user-types.enum';
import {
    TradePersonAddressVerificationDto,
    TradePersonIdentityVerificationDto,
    TradePersonKycRejectionDto,
    TradePersonProfileCreationDto,
    TradePersonKycStatusResponse,
    TradePersonProfileDto,
    TradePersonPhoneRequestDto,
    TradePersonPhoneVerifyDto,
    HealthAndSafetyComplianceDto,
    PoliceCharacterReportDto,
    BankDetailsDto,
} from '../dtos/tradeperson.kyc.dto';
import { TradePerson } from '../models/trade-person-user.model';

@ApiTags('TradePerson KYC')
@Controller('v1/trade-person-kyc')
@UseGuards(AuthGuard, UserTypeGuard)
@RequireUserType(UserType.TRADESPERSON)
export class TradePersonKycController {
    constructor(
        private readonly tradePersonKycService: TradePersonKycService,
        private readonly baseKycService: BaseKycService
    ) { }

    @Get('/status')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get TradePerson KYC Profile Status' })
    @ApiResponse({ description: 'KYC status', type: TradePersonKycStatusResponse })
    async getStatus(@user() user: TradePerson) {
        const res = await this.tradePersonKycService.getKycStatus(user);
        return adaptResponse(res);
    }

    @Post('/profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create or Update TradePerson KYC Profile' })
    @ApiResponse({ description: 'Profile created or updated', type: TradePersonProfileDto })
    async createOrUpdateProfile(@user() user: TradePerson, @Body() payload: TradePersonProfileCreationDto) {
        console.log(user, payload)
        const res = await this.baseKycService.completeProfile(user, payload);
        return adaptResponse(res, "Profile created/updated successfully");
    }

    @Post('/verify-phone')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Verify TradePerson Phone Number' })
    @ApiResponse({ description: 'Phone verification result', type: Object })
    @ApiBody({ type: TradePersonPhoneVerifyDto })
    async verifyPhoneNumber(@user() user: TradePerson, @Body() payload: TradePersonPhoneVerifyDto) {
        const { phoneNumber, otp } = payload;
        await this.baseKycService.verifyPhoneNumber(user, phoneNumber, otp);
        return adaptResponse(null, "Phone number verified successfully");
    }

    @Post('/request-phone-otp')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Request OTP for TradePerson Phone Number Verification' })
    @ApiResponse({ description: 'OTP requested', type: Object })
    @ApiBody({ type: TradePersonPhoneRequestDto })
    async requestPhoneVerificationOtp(@user() user: TradePerson, @Body() payload: TradePersonPhoneRequestDto) {
        const { phoneNumber } = payload;
        await this.baseKycService.requestPhoneVerificationOtp(user, phoneNumber);
        return adaptResponse(null, "OTP sent successfully");
    }

    @Post('/complete-identity-verification')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Complete TradePerson Identity Verification' })
    @ApiResponse({ description: 'Identity verified', type: TradePersonProfileDto })
    async completeIdentityVerification(@user() user: TradePerson, @Body() payload: TradePersonIdentityVerificationDto) {
        const { identityType, identityData, photoIdUrl, addressProofUrl } = payload;
        const res = await this.tradePersonKycService.completeIdentityVerification(user, { identityType, identityData, photoIdUrl, addressProofUrl });
        return adaptResponse(res, "Identity verification completed successfully");
    }

    @Post('/complete-address-verification')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Complete TradePerson Address Verification' })
    @ApiResponse({ description: 'Address verified', type: TradePersonProfileDto })
    async completeAddressVerification(@user() user: TradePerson, @Body() payload: TradePersonAddressVerificationDto) {
        const { address, addressProofUrl } = payload;
        const res = await this.tradePersonKycService.completeAddressVerification(user, address, addressProofUrl);
        return adaptResponse(res, "Address verification completed successfully");
    }

    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get TradePerson KYC Profile' })
    @ApiResponse({ description: 'KYC profile', type: TradePersonProfileDto })
    async getProfile(@user() user: TradePerson) {
        const res = await this.tradePersonKycService.getKycProfile(user);
        return adaptResponse(res);
    }

    // Admin endpoints
    @Post('/admin/:id/approve')
    @ApiBearerAuth()
    @UseGuards(AuthGuard, RoleGuard)
    @ApiOperation({ summary: 'Admin: Approve a TradePerson KYC' })
    @ApiResponse({ description: 'KYC approved', type: TradePersonProfileDto })
    async approveKyc(@user() user: TradePerson, @Param('id') id: string) {
        const res = await this.tradePersonKycService.approveKyc(id, user._id.toString());
        return adaptResponse(res, 'KYC approved');
    }

    @Post('/admin/:id/reject')
    @ApiBearerAuth()
    @UseGuards(AuthGuard, RoleGuard)
    @ApiOperation({ summary: 'Admin: Reject a TradePerson KYC' })
    @ApiResponse({ description: 'KYC rejected', type: TradePersonProfileDto })
    async rejectKyc(@user() user: TradePerson, @Param('id') id: string, @Body() payload: TradePersonKycRejectionDto) {
        const res = await this.tradePersonKycService.rejectKyc(id, user._id.toString(), payload.reason);
        return adaptResponse(res, 'KYC rejected');
    }

    @Post('/complete-health-safety-compliance')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Complete Health and Safety Compliance' })
    @ApiResponse({ description: 'Health and Safety compliance completed', type: TradePersonProfileDto })
    async completeHealthAndSafetyCompliance(@user() user: TradePerson, @Body() payload: HealthAndSafetyComplianceDto) {
        const res = await this.tradePersonKycService.completeHealthAndSafetyCompliance(user, payload);
        return adaptResponse(res, "Health and Safety compliance completed successfully");
    }


    @Post('/complete-police-character-report')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Complete Police Character Report' })
    @ApiResponse({ description: 'Police Character Report completed', type: TradePersonProfileDto })
    async completePoliceCharacterReport(@user() user: TradePerson, @Body() payload: PoliceCharacterReportDto){
        const profile: any = { ...payload };
        const saved = await this.tradePersonKycService.completePoliceCharacterReport(user, profile);
        return adaptResponse(saved, "Police Character Report completed successfully");
    }

    @Post('/complete-bank-details')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Complete Bank Details' })
    @ApiResponse({ description: 'Bank details completed', type: TradePersonProfileDto })
    async completeBankDetails(@user() user: TradePerson, @Body() payload: BankDetailsDto){
        const profile: any = { ...payload };
        const saved = await this.tradePersonKycService.completeBankDetails(user, profile);
        return adaptResponse(saved, "Bank details completed successfully");
    }
}
