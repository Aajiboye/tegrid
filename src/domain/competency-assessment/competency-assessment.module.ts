import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionBankController } from './controllers/question-bank.controller';
import { QuestionsBank, QuestionsBankSchema } from './models/questions-bank';
import { QuestionsBankService } from './services/question-mgt.service';
import { QuestionBankRepository } from './repositories/question-bank.repo';
import { JobTypeRepository } from '../jobs/repositories/job-type.repo';
import { JobType, JobTypeSchema } from '../jobs/models/job-type.model';
import { CompetencyTestController } from './controllers/competency-test.controller';
import { CompetencyTestService } from './services/competency-test.service';
import { CompetencyTestRepository } from './repositories/competency-test.repo';
import { CompetencyTest, CompetencyTestSchema } from './models/competency-tests';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: QuestionsBank.name, schema: QuestionsBankSchema },
            { name: JobType.name, schema: JobTypeSchema },
            { name: CompetencyTest.name, schema: CompetencyTestSchema }

        ]),
    ],
    providers: [QuestionsBankService, QuestionBankRepository, JobTypeRepository, CompetencyTestService, CompetencyTestRepository],
    controllers: [QuestionBankController, CompetencyTestController],
    exports: [],
})

export class CompetencyAssessmentModule { }
