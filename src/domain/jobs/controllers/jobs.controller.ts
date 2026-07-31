import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { JobsService } from '../services/jobs.service';
import { CreateJobRequestDto } from '../dtos/job-request.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { KycGuard } from 'src/guards/kyc.guard';
import { user } from 'src/decorators/user.decorator';
import { RoleGuard } from 'src/guards/role.guard';
import { ApiTags } from '@nestjs/swagger';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { PageOptions } from 'src/shared/dtos/pagination';

@ApiTags('Jobs')
@Controller('v1/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @UseGuards(AuthGuard, KycGuard)
  @Post()
  async create(@user() currentUser: any, @Body() body: CreateJobRequestDto) {
    const doc = await this.jobsService.createJobRequest(currentUser, body);
    return adaptResponse(doc, 'Job request created successfully');
  }

  @UseGuards(AuthGuard)
  @Get()
  async list(
    @user() currentUser: any,
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    const pageOptions: PageOptions = { page: parseInt(page as any, 10) || 1, size: parseInt(pageSize as any, 10) || 10 };
    const docs = await this.jobsService.listForUser(currentUser, pageOptions, q as any);
    return adaptResponse(docs, 'Job requests retrieved successfully');
  }

  // Admin paginated list
  @UseGuards(AuthGuard, RoleGuard)
  @Get('admin')
  async adminList(@Query('page') page = '1', @Query('pageSize') pageSize = '20', @Query('q') q?: string) {
    const pageOptions: PageOptions = { page: parseInt(page as any, 10) || 1, size: parseInt(pageSize as any, 10) || 20 };
    const res = await this.jobsService.adminList(pageOptions, q as any);
    return adaptResponse(res, 'Admin job requests retrieved successfully');
  }
}
