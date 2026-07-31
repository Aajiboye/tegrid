import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IIdentityVerifier, IdentityVerificationResult } from './IIdentityVerifier';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VerifyMeProvider implements IIdentityVerifier {
  private readonly logger = new Logger(VerifyMeProvider.name);
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('VERIFYME_BASE_URL') || '';
    this.apiKey = this.config.get<string>('VERIFYME_API_KEY');
  }

  async verifyIdentity(identityType: string, identityData: string): Promise<IdentityVerificationResult> {
    const appEnv = this.config.get<string>('APP_ENV') || this.config.get<string>('appEnv') || 'development';

    // In development, skip external verification and accept the identity data
    if (appEnv === 'development') {
      this.logger.log('Development environment detected — skipping external identity verification');
      return { success: true, providerResponse: { message: 'dev-skip' } };
    }

    // If no external provider configured, return failure
    if (!this.baseUrl) {
      this.logger.warn('VerifyMeProvider: no base URL configured; skipping external verification');
      return { success: false };
    }

    try {
      const resp = await axios.post(
        `${this.baseUrl}/verify/identity`,
        { type: identityType, value: identityData },
        {
          headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : undefined,
          timeout: 10_000,
        },
      );

      return { success: true, providerResponse: resp.data };
    } catch (err: any) {
      this.logger.error('VerifyMeProvider verification failed', err?.message || err);
      return { success: false, providerResponse: err?.response?.data || { message: err?.message } };
    }
  }

  // backwards compatibility
  async verifyNin(nin: string): Promise<IdentityVerificationResult> {
    return this.verifyIdentity('NIN', nin);
  }
}
