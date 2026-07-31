import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobType, JobTypeSchema } from './models/job-type.model';
import { JobRequest, JobRequestSchema } from './models/job-request.model';
import { JobTypeRepository } from './repositories/job-type.repo';
import { JobRequestRepository } from './repositories/job-request.repo';
import { JobsService } from './services/jobs.service';
import { JobsController } from './controllers/jobs.controller';
import { JobTypesController } from './controllers/job-types.controller';
import { TokenService } from 'src/shared/services/token.service';
import { UserModule } from '../identity/user.module';
import { UserRepository } from '../identity/repositories/user.repo';
import { User, UserSchema } from '../identity/models/user.model';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: JobType.name, schema: JobTypeSchema }, { name: JobRequest.name, schema: JobRequestSchema }, { name: User.name, schema: UserSchema }]),
        forwardRef(() => UserModule),
    ],
    providers: [JobTypeRepository, JobRequestRepository, JobsService, TokenService, UserRepository],
    controllers: [JobsController, JobTypesController],
    exports: [JobsService],
})
export class JobsModule implements OnModuleInit {
    constructor(private readonly jobsService: JobsService) { }

    async onModuleInit() {
        await this.jobsService.seedDefaultJobTypes();
    }
}
