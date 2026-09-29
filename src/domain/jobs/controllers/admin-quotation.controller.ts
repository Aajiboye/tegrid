import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { user } from 'src/decorators/user.decorator';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { JobRequestQuotationService } from '../services/job-request-quotation.service';
import { JobRequestQuotationResponseDto, QuotationEventResponseDto, ReviewQuotationDto } from '../dtos/job-request-quotation.dto';

@ApiTags('Admin Quotations')
@Controller('v1/admin/quotations')
export class AdminQuotationController {
  constructor(private readonly quotationService: JobRequestQuotationService) {}

  @Get(':jobRequestId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Admin: List all quotations for a job request' })
  @ApiResponse({ description: 'Quotations retrieved', type: [JobRequestQuotationResponseDto] })
  async listQuotations(@Param('jobRequestId') jobRequestId: string) {
    const docs = await this.quotationService.listQuotationsForJob(jobRequestId);
    return adaptResponse(docs, 'Quotations retrieved successfully');
  }

  @Post(':quotationId/review')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Admin: Move quotation to admin review' })
  @ApiResponse({ description: 'Quotation moved to review', type: JobRequestQuotationResponseDto })
  async moveToReview(
    @Param('quotationId') quotationId: string,
    @user() currentUser: any,
  ) {
    const doc = await this.quotationService.moveToAdminReview(quotationId, currentUser._id.toString());
    return adaptResponse(doc, 'Quotation moved to admin review');
  }

  @Post(':quotationId/review-decision')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Admin: Accept or reject a quotation' })
  @ApiBody({ type: ReviewQuotationDto })
  @ApiResponse({ description: 'Quotation reviewed', type: JobRequestQuotationResponseDto })
  async reviewQuotation(
    @Param('quotationId') quotationId: string,
    @Body() body: ReviewQuotationDto,
    @user() currentUser: any,
  ) {
    const doc = await this.quotationService.reviewQuotation(quotationId, body.status, body.reason, currentUser._id.toString());
    return adaptResponse(doc, `Quotation ${body.status.toLowerCase()} successfully`);
  }

  @Get(':quotationId/events')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Admin: List quotation events' })
  @ApiResponse({ description: 'Events retrieved', type: [QuotationEventResponseDto] })
  async listEvents(@Param('quotationId') quotationId: string, @Param('tradePersonId') tradePersonId: string) {
    const events = await this.quotationService.getQuotationEvents(quotationId, tradePersonId);
    return adaptResponse(events, 'Quotation events retrieved successfully');
  }
}
