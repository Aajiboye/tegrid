import { Injectable } from '@nestjs/common';
const StripeLib = require('stripe');

@Injectable()
export class StripeService {
  private stripe: any;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    this.stripe = new StripeLib(process.env.STRIPE_SECRET_KEY);
  }

  async createPaymentIntent(amount: number, currency = 'usd', customer?: string, metadata?: any) {
    return this.stripe.paymentIntents.create({
      amount,
      currency,
      customer,
      metadata,
    });
  }

  async confirmPaymentIntent(intentId: string, paymentMethodId: string) {
    return this.stripe.paymentIntents.confirm(intentId, { payment_method: paymentMethodId });
  }

  async retrievePaymentIntent(intentId: string) {
    return this.stripe.paymentIntents.retrieve(intentId);
  }

  constructEvent(payload: Buffer, sig: string, webhookSecret?: string) {
    if (!webhookSecret) return JSON.parse(payload.toString());
    return this.stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  }
}