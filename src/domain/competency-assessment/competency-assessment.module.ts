import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionBankController } from './controllers/question-bank.controller';
import { QuestionsBank, QuestionsBankSchema } from './models/questions-bank';
import { QuestionsBankService } from './services/question-mgt.service';
import { QuestionBankRepository } from './repositories/question-bank.repo';
import { CompetencyTestController } from './controllers/competency-test.controller';
import { CompetencyTestService } from './services/competency-test.service';
import { CompetencyTestRepository } from './repositories/competency-test.repo';
import { CompetencyTest, CompetencyTestSchema } from './models/competency-tests';
import { JobsModule } from '../jobs/jobs.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: QuestionsBank.name, schema: QuestionsBankSchema },
            { name: CompetencyTest.name, schema: CompetencyTestSchema }
        ]),
        JobsModule,
    ],
    providers: [QuestionsBankService, QuestionBankRepository, CompetencyTestService, CompetencyTestRepository],
    controllers: [QuestionBankController, CompetencyTestController],
    exports: [],
})

export class CompetencyAssessmentModule { }
