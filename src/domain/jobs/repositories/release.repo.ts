import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Release } from '../models/release.model';

@Injectable()
export class ReleaseRepository {
  constructor(@InjectModel(Release.name) private readonly model: Model<Release>) {}

  async create(payload: Partial<Release>): Promise<Release> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async findById(id: string): Promise<Release | null> {
    return this.model.findById(id).lean();
  }

  async findByPaymentId(paymentId: string): Promise<Release[]> {
    return this.model.find({ payment: new Types.ObjectId(paymentId) }).sort({ createdAt: 1 }).lean();
  }

  async findByQuotationId(quotationId: string): Promise<Release[]> {
    return this.model.find({ quotation: new Types.ObjectId(quotationId) }).sort({ createdAt: 1 }).lean();
  }

  async findSuccessfulByPaymentIdAndType(
    paymentId: string,
    releaseType: string,
  ): Promise<Release | null> {
    return this.model
      .findOne({
        payment: new Types.ObjectId(paymentId),
        releaseType,
        status: 'SUCCESS',
      })
      .lean();
  }

  async findPendingBalanceReleases(): Promise<Release[]> {
    return this.model
      .find({
        releaseType: 'BALANCE',
        status: 'PENDING',
      })
      .lean();
  }

  async updateById(id: string, payload: Partial<Release>): Promise<Release | null> {
    return this.model.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
  }
}
