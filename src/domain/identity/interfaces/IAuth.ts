import {
  ForgotPasswordDto,
  LoginPayload,
  LoginResponse,
  ResetPasswordPayload,
  SignUpResponse,
  UserNameExistenceResponse,
  VerifyEmailPayload,
  VerifyEmailResponse,
} from '../dtos/auth.payload.dto';
export interface IAuth {
  requestVerificationOtp(identifier: string): Promise<void>;
  verifyEmail(
    verifyEmailPayload: VerifyEmailPayload,
  ): Promise<VerifyEmailResponse>;
  login(loginPayload: LoginPayload): Promise<LoginResponse>;
  completeProfile(signupPayload: any): Promise<SignUpResponse>;
  forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void>;
  resetPassword(resetPasswordPayload: ResetPasswordPayload): Promise<void>;
  getUserNameAvailability(username:string): Promise<UserNameExistenceResponse>
}
