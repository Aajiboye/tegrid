import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JobTypeRepository } from '../repositories/job-type.repo';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { PageOptions } from 'src/shared/dtos/pagination';

@ApiTags('JobTypes')
@Controller('v1/job-types')
export class JobTypesController {
  constructor(private readonly jobTypeRepo: JobTypeRepository) {}

  @Get()
  async list(@Query('page') page = '1', @Query('pageSize') pageSize = '50', @Query('q') q?: string) {
    const pageOptions: PageOptions = { page: parseInt(page as any, 10) || 1, size: parseInt(pageSize as any, 10) || 50 };
    const query: any = {};
    if (q) query.title = { $regex: q, $options: 'i' };
    const res = await this.jobTypeRepo.findPaged(query, pageOptions);
    return adaptResponse(res);
  }
}
