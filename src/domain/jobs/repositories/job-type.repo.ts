import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobType } from '../models/job-type.model';
import { PageOptions, PaginatedResponse } from 'src/shared/dtos/pagination';

@Injectable()
export class JobTypeRepository {
  constructor(@InjectModel(JobType.name) private readonly model: Model<JobType>) {}

  async findAll(query = {}) {
    return this.model.find(query).lean();
  }

  async findOne(query: any) {
    return this.model.findOne(query).lean();
  }

  async create(doc: Partial<JobType>) {
    const d = new this.model(doc);
    return d.save();
  }

  async findPaged(query: any, pageOptions: PageOptions, select?: string, sort?: any): Promise<PaginatedResponse<JobType[]>> {
    const limit = pageOptions?.size || 10;
    const page = pageOptions?.page || 1;
    const skip = (page - 1) * limit;

    const items = await this.model
      .find(query)
      .limit(limit)
      .skip(skip)
      .sort(sort ?? { createdAt: -1 })
      .select(select)
      .lean();

    const count = await this.model.countDocuments(query).exec();
    const pageTotal = Math.ceil(count / limit);

    const pagedResponse = new PaginatedResponse<JobType[]>();
    pagedResponse.data = items;
    pagedResponse.page = page;
    pagedResponse.size = limit;
    pagedResponse.pageTotal = pageTotal;
    pagedResponse.hasNext = page < pageTotal;
    pagedResponse.hasPrevious = page > 1;

    return pagedResponse;
  }
}
