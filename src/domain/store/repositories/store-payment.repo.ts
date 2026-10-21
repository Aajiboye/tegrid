import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StorePayment, StorePaymentStatus } from '../models/store-payment.model';

@Injectable()
export class StorePaymentRepository {
  constructor(@InjectModel(StorePayment.name) private readonly model: Model<StorePayment>) {}

  async create(payload: Partial<StorePayment>): Promise<StorePayment> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async findById(id: string): Promise<StorePayment | null> {
    return this.model.findById(id).lean();
  }

  async findByReference(reference: string): Promise<StorePayment | null> {
    return this.model.findOne({ paystackReference: reference }).lean();
  }

  async findByOrder(orderId: string): Promise<StorePayment | null> {
    return this.model.findOne({ order: new Types.ObjectId(orderId) }).lean();
  }

  async updateStatus(id: string, status: StorePaymentStatus, metadata?: Record<string, any>): Promise<StorePayment | null> {
    return this.model
      .findByIdAndUpdate(id, { $set: { status, ...(metadata ? { metadata } : {}) } }, { new: true })
      .lean();
  }

  async updateByReference(reference: string, status: StorePaymentStatus, metadata?: Record<string, any>): Promise<StorePayment | null> {
    return this.model
      .findOneAndUpdate(
        { paystackReference: reference },
        { $set: { status, ...(metadata ? { metadata } : {}) } },
        { new: true },
      )
      .lean();
  }
}
