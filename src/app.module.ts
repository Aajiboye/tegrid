import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from './config/config';
import { UserModule } from './domain/identity/user.module';
import { JobsModule } from './domain/jobs/jobs.module';
import { TokenService } from './shared/services/token.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { CryptoService } from './shared/services/crypto.service';
import { WalletModule } from './domain/wallet/wallet.module';
import { CompetencyAssessmentModule } from './domain/competency-assessment/competency-assessment.module';

const configService = new ConfigService();


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    EventEmitterModule.forRoot(),
    MongooseModule.forRoot(
      configService.getOrThrow<string>('MONGODB_CONNECTION_STRING'),
    ),
    JwtModule.register({
      global: true,
      secret: configService.getOrThrow<string>('JWT_SECRET'),
    }),
    UserModule,
    JobsModule,
    WalletModule,
    CompetencyAssessmentModule
  ],
  controllers: [AppController],
  providers: [AppService, TokenService, CryptoService],
})
export class AppModule {}
