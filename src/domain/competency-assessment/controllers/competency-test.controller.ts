import { BadRequestException, Body, Controller, Get, ParseArrayPipe, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { adaptResponse } from '../../../shared/adapters/response.adapter';
import { QuestionsBankService } from '../services/question-mgt.service';
import { CompetencyTestService } from '../services/competency-test.service';
import { user } from 'src/decorators/user.decorator';
import { TradePerson } from 'src/domain/identity/models/trade-person-user.model';
import { CompetencyAssessmentDto } from '../dtos/competency-assessment.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserTypeGuard } from 'src/guards/user-type.guard';
import { UserType } from 'src/domain/identity/enums/user-types.enum';
import { RequireUserType } from 'src/decorators/require-user-type.decorator';

@ApiTags('Competency Test')
@Controller('v1/competency-test')
@UseGuards(AuthGuard, UserTypeGuard)
@RequireUserType(UserType.TRADESPERSON)
export class CompetencyTestController {
    constructor(private readonly competencyTestService: CompetencyTestService) { }
    ids: number[]

    @Get('questions')
    @ApiOperation({ summary: 'Get competency test questions based on job types' })
    @ApiResponse({ description: 'Competency test questions', type: Object })
    async getCompetencyTest(@Query('jobTypes', new ParseArrayPipe({ items: String, separator: ',' })) jobTypes: string[]) {
        if (!jobTypes || jobTypes.length === 0) {
            throw new BadRequestException('Job types are required');
        }

        const res = await this.competencyTestService.getCompetencyTestByJobType(jobTypes);
        return adaptResponse(res);
    }

    @Post('submit')
    @ApiOperation({ summary: 'Submit competency test answers' })
    @ApiBody({ type: [CompetencyAssessmentDto], description: 'Array of questionId and choosenOption' })
    @ApiResponse({ description: 'Competency test submission result', type: Object })
    @UseGuards(AuthGuard)
    async submitCompetencyTest(
        @user() tradePerson: TradePerson,
        @Body() assessment: CompetencyAssessmentDto[],
    ) {
        if (!tradePerson) {
            throw new BadRequestException('Trade person is required');
        }
        if (!assessment || assessment.length === 0) {
            throw new BadRequestException('Assessment answers are required');
        }

        const res = await this.competencyTestService.takeCompetencyTest(tradePerson._id.toString(), assessment);
        return adaptResponse(res);
    }
}