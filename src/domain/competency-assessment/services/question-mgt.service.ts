import {
    BadRequestException,
    Injectable,
    Logger,
} from '@nestjs/common';

import fs from 'fs';
import { parse } from 'csv-parse';
import { QuestionsDto } from '../dtos/question-bank.dto';
import { QuestionBankRepository } from '../repositories/question-bank.repo';
import { QuestionsBank } from '../models/questions-bank';
import { JobTypeRepository } from 'src/domain/jobs/repositories/job-type.repo';



@Injectable()
export class QuestionsBankService {
      private readonly logger = new Logger(QuestionsBankService.name);
    
    constructor(
       private readonly questionsBankRepository: QuestionBankRepository,
       private readonly jobTypeRepo: JobTypeRepository

    ) {
    }
    async importQuestionsBankFromCSV(file: Express.Multer.File): Promise<any> {
        
        const rawQuestions = await this.parseCSV(file);
        console.log('Raw Questions:', rawQuestions);
        const expectedFields = ['question', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOption', 'jobType'];
        if(!rawQuestions.every((q) => expectedFields.every((field) => field in q))) {
            throw new BadRequestException(`CSV file is missing required fields. Expected fields: ${expectedFields.join(', ')}`);
        }
        const jobTypes = await this.jobTypeRepo.findAll();
        console.log('Job Types:', jobTypes);
        const jobTypeSet = new Set(jobTypes.map((jt) => jt.title.toLocaleLowerCase()));
        const invalidJobTypes = rawQuestions.filter((q) => !jobTypeSet.has(q.jobType.toLocaleLowerCase()));
        if (invalidJobTypes.length > 0) {
            throw new BadRequestException(`Invalid job types found: ${invalidJobTypes.map((q) => q.jobType).join(', ')}`);
        }
        const questions: QuestionsBank[] = rawQuestions.map((q) => ({
            question: q.question,
            options: {
                A: q.optionA,
                B: q.optionB,
                C: q.optionC,
                D: q.optionD,
            },
            correctAnswer: q.correctAnswer,
            correctOption: q.correctOption,
            jobType: jobTypes.find((jt) => jt.title.toLocaleLowerCase() === q.jobType.toLocaleLowerCase())._id,
            isActive: true
        }));
        await this.questionsBankRepository.insertMany(questions);
        return { message: 'Questions imported successfully' };
    }   

    private parseCSV(file: Express.Multer.File): Promise<QuestionsDto[]> {
        return new Promise((resolve, reject) => {
            const questions: QuestionsDto[] = [];
        
            const parser = parse({ columns: true, trim: true });
            parser.write(file.buffer);
            parser.end();

            parser.on('data', (row) => {
                questions.push(row);
            });

            parser.on('end', () => {
                this.logger.log(`Parsed ${questions.length} questions from CSV`);
                resolve(questions);
            });

            parser.on('error', (error) => {
                this.logger.error(`Error parsing CSV: ${error.message}`);
                reject(error);
            });
        });
    }

    async getAllQuestions(payload: {pageOptions: { page: number; limit: number }; query: { jobType?: string } }): Promise<any> {  
        const { pageOptions: { page, limit }, query: { jobType } } = payload;
        const filter = jobType ? { jobType } : {};
        return this.questionsBankRepository.findPaged(filter, { page, size: limit }, null, { createdAt: -1 });
     }
}
    