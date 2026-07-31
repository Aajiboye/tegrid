import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { UserRepository } from './repositories/user.repo';
import { TokenRepository } from './repositories/token.repo';
import { User, UserSchema } from './models/user.model';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenService } from '../../shared/services/token.service';
import { AuthController } from './controllers/auth.controller';
import { Token, TokenSchema } from './models/token.model';
import { FirebaseAuthController } from './controllers/firebase-auth.controller';
import { FirebaseAuthService } from './services/firebase-auth.service';
import { EmailUtilService } from '../../shared/utils/email.util';
import { PasswordUtilService } from '../../shared/utils/password.util';
import { OTPUtilService } from '../../shared/utils/otp.utils';
import { PhoneUtilService } from 'src/shared/utils/phone.utils';
import { HomeOwnerKycController } from './controllers/home-owner-kyc.controller';
import { HomeOwnerKycService } from './services/home-owner-kyc.service';
import { HomeOwnerKycRepository } from './repositories/homeowner-kyc.repo';
import { AdminService } from './services/admin.service';
import { HomeOwnerKycProfile, HomeOwnerKycProfileSchema } from './models/homeowner-kyc.model';
import { PhoneNumberVerificationRepository } from './repositories/phone-verification.repo';
import { PhoneNumberVerification, PhoneNumberVerificationSchema } from './models/phone-number-verifications.model';
import { CryptoService } from 'src/shared/services/crypto.service';
import { RoleGuard } from 'src/guards/role.guard';
import { VerifyMeProvider } from './providers/verifyme.provider';
import { IDENTITY_VERIFIER } from './providers/constants';
import { AuditModule } from 'src/shared/audit.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      {name: Token.name, schema: TokenSchema},
      {name: HomeOwnerKycProfile.name, schema: HomeOwnerKycProfileSchema},
      {name: PhoneNumberVerification.name, schema: PhoneNumberVerificationSchema},
    ]),
    AuditModule,
  ],
  providers: [
    TokenRepository,
    AuthService,
    TokenService,
    FirebaseAuthService,
    UserRepository,
    EmailUtilService,
    PasswordUtilService,
    OTPUtilService,
    PhoneUtilService,
    HomeOwnerKycService,
    HomeOwnerKycRepository,
    PhoneNumberVerificationRepository,
    CryptoService,
    RoleGuard,
    // pluggable identity verifier (bound to token)
    {
      provide: IDENTITY_VERIFIER,
      useClass: VerifyMeProvider,
    },
  ],
  controllers: [
    AuthController,
    FirebaseAuthController,
    HomeOwnerKycController
  ],
  exports: [
    UserRepository,
    TokenRepository,
    HomeOwnerKycService,
    HomeOwnerKycRepository,
  ],
})
export class UserModule {}
