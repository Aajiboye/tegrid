import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobType, JobTypeSchema } from './models/job-type.model';
import { JobRequest, JobRequestSchema } from './models/job-request.model';
import { JobTypeRepository } from './repositories/job-type.repo';
import { JobRequestRepository } from './repositories/job-request.repo';
import { JobsService } from './services/jobs.service';
import { JobsController } from './controllers/jobs.controller';
import { JobTypesController } from './controllers/job-types.controller';
import { UserModule } from 'src/domain/identity/user.module';
import { SharedModule } from 'src/shared/shared.module';
import { TradePersonUserRepository } from '../identity/repositories/trade-person-user.repo';
import { TradePerson, TradePersonSchema } from '../identity/models/trade-person-user.model';

@Module({
    imports: [
    MongooseModule.forFeature([{ name: JobType.name, schema: JobTypeSchema }, { name: JobRequest.name, schema: JobRequestSchema }, {name: TradePerson.name, schema: TradePersonSchema}]),
        UserModule,
        SharedModule,
    ],
    providers: [JobTypeRepository, JobRequestRepository, JobsService, TradePersonUserRepository],
    controllers: [JobsController, JobTypesController],
    exports: [JobsService, JobTypeRepository],
})
export class JobsModule implements OnModuleInit {
    constructor(private readonly jobsService: JobsService) { }

    async onModuleInit() {
        await this.jobsService.seedDefaultJobTypes();
    }
}
