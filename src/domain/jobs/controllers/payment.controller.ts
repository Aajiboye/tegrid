import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { JobRequestQuotationService } from '../services/job-request-quotation.service';
import { PaymentResponseDto } from '../dtos/payment.dto';

@ApiTags('Payments')
@Controller('v1/payments')
export class PaymentController {
  constructor(private readonly quotationService: JobRequestQuotationService) {}

  @Get('paystack/callback')
  @ApiOperation({ summary: 'Paystack callback: verify a payment by reference' })
  @ApiQuery({ name: 'reference', required: true })
  @ApiResponse({ description: 'Payment verified', type: PaymentResponseDto })
  async paystackCallback(@Query('reference') reference: string) {
    const payment = await this.quotationService.handlePaystackCallback(reference);
    return adaptResponse(payment, 'Payment verified successfully');
  }

  @Post('paystack/webhook')
  @ApiOperation({ summary: 'Paystack webhook listener for charge events' })
  async paystackWebhook(@Body() body: { event: string; data: any }) {
    await this.quotationService.handlePaystackWebhook(body.event, body.data);
    return adaptResponse(null, 'Webhook processed');
  }
}
