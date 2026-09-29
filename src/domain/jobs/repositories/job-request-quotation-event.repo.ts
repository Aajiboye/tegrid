import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobRequestQuotationEvent, QuotationEventType } from '../models/job-request-quotation-event.model';

@Injectable()
export class JobRequestQuotationEventRepository {
  constructor(
    @InjectModel(JobRequestQuotationEvent.name)
    private readonly model: Model<JobRequestQuotationEvent>,
  ) {}

  async create(payload: {
    quotation: Types.ObjectId;
    jobRequest: Types.ObjectId;
    tradePerson?: Types.ObjectId;
    eventType: QuotationEventType;
    notes?: string;
    performedBy?: Types.ObjectId;
    metadata?: Record<string, any>;
  }): Promise<JobRequestQuotationEvent> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async findByQuotationId(quotationId: string): Promise<JobRequestQuotationEvent[]> {
    return this.model
      .find({ quotation: new Types.ObjectId(quotationId) })
      .sort({ createdAt: 1 })
      .lean();
  }

  async findByQuotationIdAndTradePersonId(quotationId: string, tradePersonId: string): Promise<JobRequestQuotationEvent[]> {
    return this.model
      .find({ quotation: new Types.ObjectId(quotationId), tradePerson: new Types.ObjectId(tradePersonId) })
      .sort({ createdAt: 1 })
      .lean();
  }

  async findByJobRequestId(jobRequestId: string): Promise<JobRequestQuotationEvent[]> {
    return this.model
      .find({ jobRequest: new Types.ObjectId(jobRequestId) })
      .sort({ createdAt: 1 })
      .lean();
  }
}
