import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserTypeGuard } from 'src/guards/user-type.guard';
import { user } from 'src/decorators/user.decorator';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { JobRequestQuotationService } from '../services/job-request-quotation.service';
import { CreateJobRequestQuotationDto, JobRequestQuotationResponseDto, UpdateJobRequestQuotationDto } from '../dtos/job-request-quotation.dto';
import { RequireUserType } from 'src/decorators/require-user-type.decorator';
import { UserType } from 'src/domain/identity/enums/user-types.enum';
import { TradePerson } from 'src/domain/identity/models/trade-person-user.model';

@ApiTags('Job Request Quotations')
@Controller('v1/jobs/:jobRequestId/quotation')
@UseGuards(AuthGuard, UserTypeGuard)
@RequireUserType(UserType.TRADESPERSON)
export class JobRequestQuotationController {
  constructor(private readonly quotationService: JobRequestQuotationService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a quotation for a job request' })
  @ApiBody({ type: CreateJobRequestQuotationDto })
  @ApiResponse({ description: 'Quotation created', type: JobRequestQuotationResponseDto })
  async create(
    @user() currentUser: TradePerson,
    @Param('jobRequestId') jobRequestId: string,
    @Body() body: CreateJobRequestQuotationDto,
  ) {
    const doc = await this.quotationService.create(currentUser._id.toString(), jobRequestId, body);
    return adaptResponse(doc, 'Quotation submitted successfully');
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quotation for a job request' })
  @ApiResponse({ description: 'Quotation retrieved', type: JobRequestQuotationResponseDto })
  async get(@Param('jobRequestId') jobRequestId: string, @user() currentUser: TradePerson) {
    const doc = await this.quotationService.getByJobRequestId(jobRequestId, currentUser._id.toString());
    return adaptResponse(doc, 'Quotation retrieved successfully');
  }

  @Put()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update quotation for a job request' })
  @ApiBody({ type: UpdateJobRequestQuotationDto })
  @ApiResponse({ description: 'Quotation updated', type: JobRequestQuotationResponseDto })
  async update(
    @user() currentUser: TradePerson,
    @Param('jobRequestId') jobRequestId: string,
    @Body() body: UpdateJobRequestQuotationDto,
  ) {
    const doc = await this.quotationService.update(currentUser._id.toString(), jobRequestId, body);
    return adaptResponse(doc, 'Quotation updated successfully');
  }

  @Delete()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete quotation for a job request' })
  async delete(
    @user() currentUser: any,
    @Param('jobRequestId') jobRequestId: string,
  ) {
    await this.quotationService.delete(currentUser._id.toString(), jobRequestId);
    return adaptResponse(null, 'Quotation deleted successfully');
  }
}
