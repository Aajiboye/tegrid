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
}
