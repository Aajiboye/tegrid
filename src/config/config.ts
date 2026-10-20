import { ConfigProps } from './interfaces/IConfig';

export const config = (): ConfigProps => ({
  port: parseInt(process.env.PORT, 10) || 8080,
  api: {
    apiUrl: process.env.API_URL,
    httpTimeout: 1000,
    defaultCountry: process.env.defaultCountry || 'NG',
  },
  payment: {
    upfrontReleasePercentage: parseInt(process.env.UPFRONT_RELEASE_PERCENTAGE, 10) || 70,
    paystackSecret: process.env.PAYSTACK_SECRET || '',
    paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
    callbackUrl: process.env.PAYSTACK_CALLBACK_URL || `${process.env.API_URL || 'http://localhost:8080'}/v1/payments/paystack/callback`,
  },
  appEnv: process.env.APP_ENV || 'development',
  frontEndLink: process.env.FRONTEND_LINK || 'http://localhost:3000',
});
