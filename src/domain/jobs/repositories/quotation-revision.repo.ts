import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QuotationRevision } from '../models/quotation-revision.model';

@Injectable()
export class QuotationRevisionRepository {
  constructor(
    @InjectModel(QuotationRevision.name)
    private readonly model: Model<QuotationRevision>,
  ) {}

  async create(payload: Partial<QuotationRevision>): Promise<QuotationRevision> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async findByQuotationId(quotationId: string): Promise<QuotationRevision[]> {
    return this.model
      .find({ quotation: new Types.ObjectId(quotationId) })
      .sort({ revisionNumber: -1 })
      .lean();
  }

  async findByQuotationIdAndRevisionNumber(
    quotationId: string,
    revisionNumber: number,
  ): Promise<QuotationRevision | null> {
    return this.model
      .findOne({
        quotation: new Types.ObjectId(quotationId),
        revisionNumber,
      })
      .lean();
  }

  async findLatestByQuotationId(quotationId: string): Promise<QuotationRevision | null> {
    return this.model
      .findOne({ quotation: new Types.ObjectId(quotationId) })
      .sort({ revisionNumber: -1 })
      .lean();
  }
}
