import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserTypeGuard } from 'src/guards/user-type.guard';
import { RequireUserType } from 'src/decorators/require-user-type.decorator';
import { user } from 'src/decorators/user.decorator';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { JobRequestQuotationService } from '../services/job-request-quotation.service';
import {
  HomeOwnerAcceptQuotationDto,
  HomeOwnerRejectQuotationDto,
  JobRequestQuotationResponseDto,
} from '../dtos/job-request-quotation.dto';
import { PayUpfrontResponseDto } from '../dtos/payment.dto';
import {
  VerificationCodeResponseDto,
  VerifyCodeDto,
} from '../dtos/verification-code.dto';
import { CreateReviewDto, ReviewResponseDto } from '../dtos/review.dto';
import { UserType } from 'src/domain/identity/enums/user-types.enum';
import { HomeOwner } from 'src/domain/identity/models/home-owner-user.model';

@ApiTags('HomeOwner Quotations')
@Controller('v1/jobs/:jobRequestId')
@UseGuards(AuthGuard, UserTypeGuard)
@RequireUserType(UserType.HomeOwner)
export class HomeOwnerQuotationController {
  constructor(private readonly quotationService: JobRequestQuotationService) {}

  @Get('quotations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'HomeOwner: List admin-approved quotations for a job they created' })
  @ApiResponse({ description: 'Quotations retrieved', type: [JobRequestQuotationResponseDto] })
  async listQuotations(
    @user() currentUser: HomeOwner,
    @Param('jobRequestId') jobRequestId: string,
  ) {
    const docs = await this.quotationService.listQuotationsForHomeOwner(
      currentUser._id.toString(),
      jobRequestId,
    );
    return adaptResponse(docs, 'Quotations retrieved successfully');
  }

  @Get('accepted-quotation')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'HomeOwner: View accepted quotation for a job they created' })
  @ApiResponse({ description: 'Accepted quotation retrieved', type: JobRequestQuotationResponseDto })
  async getAcceptedQuotation(
    @user() currentUser: HomeOwner,
    @Param('jobRequestId') jobRequestId: string,
  ) {
    const doc = await this.quotationService.getAcceptedQuotationForHomeOwner(
      currentUser._id.toString(),
      jobRequestId,
    );
    return adaptResponse(doc, 'Accepted quotation retrieved successfully');
  }

  @Post('quotations/:quotationId/accept')
  @ApiBearerAuth()
  @ApiBody({ type: HomeOwnerAcceptQuotationDto })
  @ApiOperation({ summary: 'HomeOwner: Accept an admin-approved quotation' })
  @ApiResponse({ description: 'Quotation accepted', type: JobRequestQuotationResponseDto })
  async acceptQuotation(
    @user() currentUser: HomeOwner,
    @Param('jobRequestId') jobRequestId: string,
    @Param('quotationId') quotationId: string,
    @Body() body: HomeOwnerAcceptQuotationDto,
  ) {
    const doc = await this.quotationService.acceptQuotation(
      currentUser._id.toString(),
      jobRequestId,
      quotationId,
      body.notes,
    );
    return adaptResponse(doc, 'Quotation accepted successfully');
  }

  @Post('quotations/:quotationId/reject')
  @ApiBearerAuth()
  @ApiBody({ type: HomeOwnerRejectQuotationDto })
  @ApiOperation({ summary: 'HomeOwner: Reject an admin-approved quotation' })
  @ApiResponse({ description: 'Quotation rejected', type: JobRequestQuotationResponseDto })
  async rejectQuotation(
    @user() currentUser: HomeOwner,
    @Param('jobRequestId') jobRequestId: string,
    @Param('quotationId') quotationId: string,
    @Body() body: HomeOwnerRejectQuotationDto,
  ) {
    const doc = await this.quotationService.rejectQuotation(
      currentUser._id.toString(),
      jobRequestId,
      quotationId,
      body.reason,
    );
    return adaptResponse(doc, 'Quotation rejected successfully');
  }

  @Post('quotations/:quotationId/pay')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'HomeOwner: Pay the full accepted quotation amount via Paystack' })
  @ApiResponse({ description: 'Payment initialized', type: PayUpfrontResponseDto })
  async payQuotation(
    @user() currentUser: HomeOwner,
    @Param('jobRequestId') jobRequestId: string,
    @Param('quotationId') quotationId: string,
  ) {
    const result = await this.quotationService.initializeUpfrontPayment(
      currentUser._id.toString(),
      currentUser.email,
      jobRequestId,
      quotationId,
    );
    return adaptResponse(result, 'Payment initialized successfully');
  }

  @Get('verification-code')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'HomeOwner: View the tradesperson verification code' })
  @ApiResponse({ description: 'Verification code retrieved', type: VerificationCodeResponseDto })
  async getVerificationCode(
    @user() currentUser: HomeOwner,
    @Param('jobRequestId') jobRequestId: string,
  ) {
    const result = await this.quotationService.getVerificationCode(
      currentUser._id.toString(),
      jobRequestId,
    );
    return adaptResponse(result, 'Verification code retrieved successfully');
  }

  @Post('verify-code')
  @ApiBearerAuth()
  @ApiBody({ type: VerifyCodeDto })
  @ApiOperation({ summary: 'HomeOwner: Verify the code presented by the tradesperson' })
  async verifyCode(
    @user() currentUser: HomeOwner,
    @Param('jobRequestId') jobRequestId: string,
    @Body() body: VerifyCodeDto,
  ) {
    const result = await this.quotationService.verifyCode(
      currentUser._id.toString(),
      jobRequestId,
      body.code,
    );
    return adaptResponse(result, result.valid ? 'Code verified' : 'Code invalid');
  }

  @Post('complete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'HomeOwner: Mark the job as complete' })
  async markComplete(
    @user() currentUser: HomeOwner,
    @Param('jobRequestId') jobRequestId: string,
  ) {
    const result = await this.quotationService.markJobComplete(
      currentUser._id.toString(),
      jobRequestId,
    );
    return adaptResponse(result, 'Job marked as complete successfully');
  }

  @Post('review')
  @ApiBearerAuth()
  @ApiBody({ type: CreateReviewDto })
  @ApiOperation({ summary: 'HomeOwner: Review the tradesperson for this job' })
  @ApiResponse({ description: 'Review created', type: ReviewResponseDto })
  async createReview(
    @user() currentUser: HomeOwner,
    @Param('jobRequestId') jobRequestId: string,
    @Body() body: CreateReviewDto,
  ) {
    const result = await this.quotationService.createReview(
      currentUser._id.toString(),
      jobRequestId,
      body,
    );
    return adaptResponse(result, 'Review submitted successfully');
  }
}
