import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './services/home-owner-auth.service';
import { TokenRepository } from './repositories/token.repo';
import { HomeOwner, HomeOwnerSchema } from './models/home-owner-user.model';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenService } from '../../shared/services/token.service';
import { AuthController } from './controllers/auth.controller';
import { Token, TokenSchema } from './models/token.model';
import { FirebaseAuthController } from './controllers/firebase-auth.controller';
import { FirebaseAuthService } from './services/firebase-auth.service';
import { EmailUtilService } from '../../shared/utils/email.util';
import { PasswordUtilService } from '../../shared/utils/password.util';
import { OTPUtilService } from '../../shared/utils/otp.utils';
import { PhoneUtilService } from '../../shared/utils/phone.utils';
import { SharedModule } from '../../shared/shared.module';
import { HomeOwnerKycController } from './controllers/home-owner-kyc.controller';
import { HomeOwnerKycService } from './services/home-owner-kyc.service';
import { HomeOwnerKycRepository } from './repositories/homeowner-kyc.repo';
import { AdminService } from './services/admin.service';
import { HomeOwnerKycProfile, HomeOwnerKycProfileSchema } from './models/homeowner-kyc.model';
import { PhoneNumberVerificationRepository } from './repositories/phone-verification.repo';
import { PhoneNumberVerification, PhoneNumberVerificationSchema } from './models/phone-number-verifications.model';
import { CryptoService } from '../../shared/services/crypto.service';
import { RoleGuard } from 'src/guards/role.guard';
import { VerifyMeProvider } from './providers/verifyme.provider';
import { IDENTITY_VERIFIER } from './providers/constants';
import { AuditModule } from 'src/shared/audit.module';
import { Admin, AdminSchema } from './models/admin.model';
import { AdminRepository } from './repositories/admin.repo';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AuditService } from '../../shared/services/audit.service';
import { AuditRepository } from '../../shared/repositories/audit.repo';
import { AuditLog, AuditLogSchema } from 'src/shared/models/audit.model';
import { TradePersonAuthService } from './services/trade-person-auth.service';
import { TradePersonUserRepository } from './repositories/trade-person-user.repo';
import { TradePerson, TradePersonSchema } from './models/trade-person-user.model';
import { TradePersonKycService } from './services/trade-person-kyc.service';
import { TradePersonKycController } from './controllers/trade-person-kyc.controller';
import { BaseKycService } from './services/base-kyc.service';
import { HomeOwnerRepository } from './repositories/user.repo';
import { TradePersonKycRepository } from './repositories/trade-person-kyc.repo';
import { UserTypeGuard } from 'src/guards/user-type.guard';
import { TradePersonKycProfile, TradePersonKycSchema } from './models/trade-person-kyc.model';
import { JobsModule } from '../jobs/jobs.module';
import { JobTypeRepository } from 'src/domain/jobs/repositories/job-type.repo';
import { JobType, JobTypeSchema } from '../jobs/models/job-type.model';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HomeOwner.name, schema: HomeOwnerSchema },
      { name: Token.name, schema: TokenSchema },
      { name: HomeOwnerKycProfile.name, schema: HomeOwnerKycProfileSchema },
      { name: TradePerson.name, schema: TradePersonSchema },
      { name: PhoneNumberVerification.name, schema: PhoneNumberVerificationSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: TradePersonKycProfile.name, schema: TradePersonKycSchema },
      { name: JobType.name, schema: JobTypeSchema}

    ]),
    AuditModule,
    SharedModule,
    JobsModule,
  ],
  providers: [
    TokenRepository,
    AuthService,
    TokenService,
    FirebaseAuthService,
    HomeOwnerRepository,
    EmailUtilService,
    PasswordUtilService,
    OTPUtilService,
    PhoneUtilService,
    TradePersonUserRepository,
    HomeOwnerKycService,
    HomeOwnerKycRepository,
    TradePersonAuthService,
    TradePersonKycService,
    BaseKycService,
    PhoneNumberVerificationRepository,
    CryptoService,
    RoleGuard,
    UserTypeGuard,
    AdminRepository,
    AdminService,
    AuditService,
    AuditRepository,
    // pluggable identity verifier (bound to token)
    TradePersonKycRepository,
    JobTypeRepository,
    {
      provide: IDENTITY_VERIFIER,
      useClass: VerifyMeProvider,
    },
  ],
  controllers: [
    AuthController,
    FirebaseAuthController,
    HomeOwnerKycController,
    TradePersonKycController,
    AdminAuthController,
    (require('./controllers/trade-person-auth.controller').TradePersonAuthController),
  ],
  exports: [
    HomeOwnerRepository,
    TokenRepository,
    HomeOwnerKycService,
    HomeOwnerKycRepository,
    AdminService,
    AdminRepository,
  ],
})
export class UserModule { }
