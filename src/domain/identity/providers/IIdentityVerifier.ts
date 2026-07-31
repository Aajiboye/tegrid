export interface IdentityVerificationResult {
  success: boolean;
  providerResponse?: any;
}

export interface IIdentityVerifier {
  // Verify the supplied national identification number (nin) and return a result.
  verifyNin(nin: string, metadata?: Record<string, any>): Promise<IdentityVerificationResult>;
}
