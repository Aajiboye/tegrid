import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobType, JobTypeSchema } from './models/job-type.model';
import { JobRequest, JobRequestSchema } from './models/job-request.model';
import { JobRequestQuotation, JobRequestQuotationSchema } from './models/job-request-quotation.model';
import { JobRequestQuotationEvent, JobRequestQuotationEventSchema } from './models/job-request-quotation-event.model';
import { QuotationRevision, QuotationRevisionSchema } from './models/quotation-revision.model';
import { Payment, PaymentSchema } from './models/payment.model';
import { Release, ReleaseSchema } from './models/release.model';
import { Review, ReviewSchema } from './models/review.model';
import { JobTypeRepository } from './repositories/job-type.repo';
import { JobRequestRepository } from './repositories/job-request.repo';
import { JobRequestQuotationRepository } from './repositories/job-request-quotation.repo';
import { JobRequestQuotationEventRepository } from './repositories/job-request-quotation-event.repo';
import { QuotationRevisionRepository } from './repositories/quotation-revision.repo';
import { PaymentRepository } from './repositories/payment.repo';
import { ReleaseRepository } from './repositories/release.repo';
import { ReviewRepository } from './repositories/review.repo';
import { JobsService } from './services/jobs.service';
import { JobRequestQuotationService } from './services/job-request-quotation.service';
import { JobsController } from './controllers/jobs.controller';
import { JobTypesController } from './controllers/job-types.controller';
import { JobRequestQuotationController } from './controllers/job-request-quotation.controller';
import { PaymentController } from './controllers/payment.controller';
import { ReviewsController } from './controllers/reviews.controller';
import { SharedModule } from 'src/shared/shared.module';
import { TradePersonUserRepository } from '../identity/repositories/trade-person-user.repo';
import { TradePerson, TradePersonSchema } from '../identity/models/trade-person-user.model';
import { UserModule } from '../identity/user.module';
import { TradePersonKycService } from '../identity/services/trade-person-kyc.service';
import { TradePersonKycRepository } from '../identity/repositories/trade-person-kyc.repo';
import { TradePersonKycProfile, TradePersonKycProfileSchema } from '../identity/models/trade-person-kyc.model';
import { AuditModule } from 'src/shared/audit.module';
import { WalletModule } from '../wallet/wallet.module';
import { MessagingModule } from '../messaging/messaging.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminQuotationController } from './controllers/admin-quotation.controller';
import { HomeOwnerQuotationController } from './controllers/home-owner-quotation.controller';
import { TradePersonContractController } from './controllers/trade-person-contract.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: JobType.name, schema: JobTypeSchema },
            { name: JobRequest.name, schema: JobRequestSchema },
            { name: TradePerson.name, schema: TradePersonSchema },
            { name: JobRequestQuotation.name, schema: JobRequestQuotationSchema },
            { name: TradePersonKycProfile.name, schema: TradePersonKycProfileSchema },
            { name: JobRequestQuotationEvent.name, schema: JobRequestQuotationEventSchema },
            { name: QuotationRevision.name, schema: QuotationRevisionSchema },
            { name: Payment.name, schema: PaymentSchema },
            { name: Release.name, schema: ReleaseSchema },
            { name: Review.name, schema: ReviewSchema },
        ]),
        SharedModule,
        forwardRef(() => UserModule),
        forwardRef(() => AuditModule),
        forwardRef(() => WalletModule),
        forwardRef(() => MessagingModule),
        NotificationsModule,
    ],
    providers: [
        JobTypeRepository,
        JobRequestRepository,
        JobsService,
        TradePersonUserRepository,
        TradePersonKycRepository,
        JobRequestQuotationRepository,
        JobRequestQuotationEventRepository,
        QuotationRevisionRepository,
        PaymentRepository,
        ReleaseRepository,
        ReviewRepository,
        JobRequestQuotationService,
    ],
    controllers: [
        JobsController,
        JobTypesController,
        JobRequestQuotationController,
        AdminQuotationController,
        HomeOwnerQuotationController,
        TradePersonContractController,
        PaymentController,
        ReviewsController,
    ],
    exports: [JobsService, JobTypeRepository],
})
export class JobsModule implements OnModuleInit {
    constructor(private readonly jobsService: JobsService) { }

    async onModuleInit() {
        await this.jobsService.seedDefaultJobTypes();
    }
}
