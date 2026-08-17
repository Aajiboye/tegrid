import { Module, Global } from '@nestjs/common';
import { EmailUtilService } from './utils/email.util';
import { PasswordUtilService } from './utils/password.util';
import { OTPUtilService } from './utils/otp.utils';
import { PhoneUtilService } from './utils/phone.utils';
import { CryptoService } from './services/crypto.service';
import { TokenService } from './services/token.service';
import { AuthGuard } from 'src/guards/auth.guard';

@Global()
@Module({
  providers: [EmailUtilService, PasswordUtilService, OTPUtilService, PhoneUtilService, CryptoService, TokenService, AuthGuard],
  exports: [EmailUtilService, PasswordUtilService, OTPUtilService, PhoneUtilService, CryptoService, TokenService, AuthGuard],
})
export class SharedModule {}
