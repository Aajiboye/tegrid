import {
    Injectable,
    Logger,
} from '@nestjs/common';

import { QuestionBankRepository } from '../repositories/question-bank.repo';
import { QuestionsBank } from '../models/questions-bank';
import { Types } from 'mongoose';
import { CompetencyTestRepository } from '../repositories/competency-test.repo';



@Injectable()
export class CompetencyTestService {
    private readonly logger = new Logger(CompetencyTestService.name);

    constructor(
        private readonly questionsBankRepository: QuestionBankRepository,
        private readonly competencyTestRepository: CompetencyTestRepository

    ) {
    }
    getCompetencyTestByJobType(jobTypes: string[]): Promise<QuestionsBank[]> {
        const jobTypeObjects = jobTypes.map(id => new Types.ObjectId(id));
        return this.questionsBankRepository.findRandom({ jobType: { $in: jobTypeObjects }, isActive: true }, 10);
    }

    async takeCompetencyTest(tradePersonId: string, assessment: { questionId: string; choosenOption: string }[]): Promise<any> {
        // retrieve the correct answers for the given question IDs
        const questionIds = assessment.map(item => new Types.ObjectId(item.questionId));
        const correctAnswers = await this.questionsBankRepository.findAll({ _id: { $in: questionIds } });
        const assessmentWithObjectIds = assessment.map(item => {
            const correctAnswer = correctAnswers.find(q => q._id.toString() === item.questionId);
            return {
                questionId: new Types.ObjectId(item.questionId),
                choosenOption: item.choosenOption,
                correct: correctAnswer ? correctAnswer.correctOption === item.choosenOption : false
            };
        });

        return this.competencyTestRepository.create({
            tradePersonId: new Types.ObjectId(tradePersonId),
            assessmentDetails: assessmentWithObjectIds,
            assessmentDate: new Date(),
            assessmentScore: assessmentWithObjectIds.filter(item => item.correct).length,
            passed: assessmentWithObjectIds.filter(item => item.correct).length >= 7,
        });
    }
}
