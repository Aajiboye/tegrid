export interface IdentityVerificationResult {
  success: boolean;
  providerResponse?: any;
}

export interface IIdentityVerifier {
  // Verify a supplied identity value (identityData) for a given identityType and return a result.
  verifyIdentity(identityType: string, identityData: string, metadata?: Record<string, any>): Promise<IdentityVerificationResult>;

  // Backwards compatible alias for providers that implemented verifyNin
  verifyNin?(nin: string, metadata?: Record<string, any>): Promise<IdentityVerificationResult>;
}
