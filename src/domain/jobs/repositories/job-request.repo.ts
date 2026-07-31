import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobRequest } from '../models/job-request.model';
import { PageOptions, PaginatedResponse } from 'src/shared/dtos/pagination';

@Injectable()
export class JobRequestRepository {
  constructor(@InjectModel(JobRequest.name) private readonly model: Model<JobRequest>) {}

  async create(payload: Partial<JobRequest>) {
    const doc = new this.model(payload);
    return doc.save();
  }

  async find(query: any, options: { skip?: number; limit?: number } = {}) {
    const q = this.model
      .find(query)
      .populate('jobType')
      .populate('createdBy', 'phoneNumber userType userName _id');
    if (options.skip) q.skip(options.skip);
    if (options.limit) q.limit(options.limit);
    return q.lean();
  }

  async count(query: any) {
    return this.model.countDocuments(query);
  }

  async findPaged(query: any, pageOptions: PageOptions, select?: string, sort?: any): Promise<PaginatedResponse<JobRequest[]>> {
    const limit = pageOptions?.size || 10;
    const page = pageOptions?.page || 1;
    const skip = (page - 1) * limit;

    const items = await this.model
      .find(query)
      .limit(limit)
      .skip(skip)
      .sort(sort ?? { createdAt: -1 })
      .populate('jobType')
      .populate('createdBy', 'phoneNumber userType userName _id')
      .select(select)
      .lean();

    const count = await this.model.countDocuments(query).exec();
    const pageTotal = Math.ceil(count / limit);

    const pagedResponse = new PaginatedResponse<JobRequest[]>();
    pagedResponse.data = items;
    pagedResponse.page = page;
    pagedResponse.size = limit;
    pagedResponse.pageTotal = pageTotal;
    pagedResponse.hasNext = page < pageTotal;
    pagedResponse.hasPrevious = page > 1;

    return pagedResponse;
  }
}
