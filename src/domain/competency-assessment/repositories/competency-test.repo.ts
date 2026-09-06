import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, Model } from 'mongoose';
import { PageOptions, PaginatedResponse } from 'src/shared/dtos/pagination';
import { QuestionsBank } from '../models/questions-bank';
import { CompetencyTest } from '../models/competency-tests';

@Injectable()
export class CompetencyTestRepository {
  constructor(@InjectModel(CompetencyTest.name) private readonly model: Model<CompetencyTest>) {}

  async findAll(query = {}) {
    return this.model.find(query).lean();
  }

  async findOne(query: any) {
    return this.model.findOne(query).lean();
  }

  async create(doc: Partial<CompetencyTest>) {
    const d = new this.model(doc);
    return d.save();
  }

  async insertMany(docs: Partial<CompetencyTest>[]) {
    return this.model.insertMany(docs);
  }

  async deleteMany(query: any): Promise<DeleteResult> {
    return this.model.deleteMany(query);
  }

  async findPaged(query: any, pageOptions: PageOptions, select?: string, sort?: any): Promise<PaginatedResponse<CompetencyTest[]>> {
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

    const pagedResponse = new PaginatedResponse<CompetencyTest[]>();
    pagedResponse.data = items;
    pagedResponse.page = page;
    pagedResponse.size = limit;
    pagedResponse.pageTotal = pageTotal;
    pagedResponse.hasNext = page < pageTotal;
    pagedResponse.hasPrevious = page > 1;

    return pagedResponse;
  }

  findRandom(query: any, limit: number): Promise<CompetencyTest[]> {
    return this.model.aggregate([{ $match: query }, { $sample: { size: limit } }]).exec();
  }
}
