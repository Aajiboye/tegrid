import { BadRequestException, Body, Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { adaptResponse } from '../../../shared/adapters/response.adapter';
import { QuestionsBankService } from '../services/question-mgt.service';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Question Bank')
@Controller('v1/question-bank')
export class QuestionBankController {
    constructor(private readonly questionBankService: QuestionsBankService) { }

    @Post('import')
    @ApiOperation({ summary: 'Import questions from CSV' })
    @ApiBody({ description: 'CSV file containing questions', type: 'multipart/form-data', schema: { type: 'object', properties: { csv: { type: 'string', format: 'binary' } } } })
    @ApiResponse({ description: 'Import response', type: Object })
    @UseInterceptors(
        FileInterceptor('questions-file', {
            fileFilter: (req, file, callback) => {
                if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
                    return callback(new BadRequestException('Only CSV files are allowed!'), false);
                }
                callback(null, true);
            },
        }),
    )
    async importQuestions(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('File is required');
        const res = await this.questionBankService.importQuestionsBankFromCSV(file);
        return adaptResponse(res);
    }

    @Get('list')
    @ApiOperation({ summary: 'Get all questions with pagination and optional job type filter' })
    @ApiBody({ description: 'Pagination and filter options', type: Object })
    @ApiResponse({ description: 'List of questions', type: Object })
    async getAllQuestions(@Query('page') page: number = 1, @Query('limit') limit: number = 10, @Query('jobType') jobType?: string) {
        const query = { pageOptions: { page, limit }, query: { jobType } };
        const res = await this.questionBankService.getAllQuestions(query);
        return adaptResponse(res);
    }
}