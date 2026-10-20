import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { CheckoutService } from '../services/checkout.service';

@ApiTags('Store Payments')
@Controller('v1/store/payments')
export class StorePaymentController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Get('paystack/callback')
  @ApiOperation({ summary: 'Paystack payment callback' })
  async callback(@Query('reference') reference: string) {
    const result = await this.checkoutService.handlePaystackCallback(reference);
    return adaptResponse(result, 'Payment verified successfully');
  }

  @Post('paystack/webhook')
  @ApiOperation({ summary: 'Paystack payment webhook' })
  async webhook(@Body() body: { event: string; data: any }) {
    await this.checkoutService.handlePaystackWebhook(body.event, body.data);
    return adaptResponse(null, 'Webhook received');
  }
}
