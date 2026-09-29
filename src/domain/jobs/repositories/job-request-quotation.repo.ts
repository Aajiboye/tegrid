import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobRequestQuotation } from '../models/job-request-quotation.model';

@Injectable()
export class JobRequestQuotationRepository {
  constructor(
    @InjectModel(JobRequestQuotation.name)
    private readonly model: Model<JobRequestQuotation>,
  ) {}

  async create(payload: Partial<JobRequestQuotation>): Promise<JobRequestQuotation> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async findById(id: string): Promise<JobRequestQuotation> {
    return this.model.findById(id).lean();
  }

  async findOne(query: any): Promise<JobRequestQuotation> {
    return this.model.findOne(query).lean();
  }

  async findByJobRequestId(jobRequestId: string): Promise<JobRequestQuotation> {
    return this.model.findOne({ jobRequest: new Types.ObjectId(jobRequestId) }).lean();
  }

  async findByJobRequestIdAll(jobRequestId: string): Promise<JobRequestQuotation[]> {
    return this.model.find({ jobRequest: new Types.ObjectId(jobRequestId) }).lean();
  }

  async findAcceptedByJobRequestId(jobRequestId: string): Promise<JobRequestQuotation> {
    return this.model.findOne({
      jobRequest: new Types.ObjectId(jobRequestId),
      reviewStatus: 'APPROVED',
    }).lean();
  }

  async update(id: string, payload: Partial<JobRequestQuotation>): Promise<JobRequestQuotation> {
    return this.model.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
  }

  async deleteById(id: string): Promise<JobRequestQuotation> {
    return this.model.findByIdAndDelete(id).lean();
  }

  async findByJobRequestIdAllPopulated(jobRequestId: string): Promise<JobRequestQuotation[]> {
    return this.model
      .find({ jobRequest: new Types.ObjectId(jobRequestId) })
      .populate('tradePerson', 'email userName profileAvatar _id')
      .lean();
  }

  async findByTradePersonId(tradePersonId: string, jobRequestIds?: string[]): Promise<JobRequestQuotation[]> {
    const query: any = { tradePerson: new Types.ObjectId(tradePersonId) };
    if (jobRequestIds?.length) {
      query.jobRequest = { $in: jobRequestIds.map((id) => new Types.ObjectId(id)) };
    }
    return this.model.find(query).lean();
  }

  async updateIfPending(id: string, payload: Partial<JobRequestQuotation>): Promise<JobRequestQuotation | null> {
    return this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), reviewStatus: 'PENDING' },
        { $set: payload },
        { new: true },
      )
      .lean();
  }

  async findAcceptedByJobRequestIdExcludeCurrent(jobRequestId: string, excludeQuotationId: string): Promise<JobRequestQuotation | null> {
    return this.model
      .findOne({
        _id: { $ne: new Types.ObjectId(excludeQuotationId) },
        jobRequest: new Types.ObjectId(jobRequestId),
        reviewStatus: 'ACCEPTED',
      })
      .lean();
  }
}
