import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserTypeGuard } from 'src/guards/user-type.guard';
import { RequireUserType } from 'src/decorators/require-user-type.decorator';
import { user } from 'src/decorators/user.decorator';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { JobRequestQuotationService } from '../services/job-request-quotation.service';
import { JobRequestQuotationResponseDto } from '../dtos/job-request-quotation.dto';
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
  @ApiOperation({ summary: 'HomeOwner: List all quotations for a job they created' })
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
}
