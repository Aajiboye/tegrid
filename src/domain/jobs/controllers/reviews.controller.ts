import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { JobRequestQuotationService } from '../services/job-request-quotation.service';
import { ReviewResponseDto } from '../dtos/review.dto';

@ApiTags('Reviews')
@Controller('v1/tradeperson')
export class ReviewsController {
  constructor(private readonly quotationService: JobRequestQuotationService) {}

  @Get(':tradePersonId/reviews')
  @ApiOperation({ summary: 'List reviews for a tradesperson' })
  @ApiResponse({ description: 'Reviews retrieved', type: [ReviewResponseDto] })
  async getReviews(@Param('tradePersonId') tradePersonId: string) {
    const result = await this.quotationService.getReviewsForTradePerson(tradePersonId);
    return adaptResponse(result, 'Reviews retrieved successfully');
  }
}
