import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment } from '../models/payment.model';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectModel(Payment.name)
    private readonly model: Model<Payment>,
  ) {}

  async create(payload: Partial<Payment>): Promise<Payment> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async findById(id: string): Promise<Payment | null> {
    return this.model.findById(id).lean();
  }

  async findByReference(reference: string): Promise<Payment | null> {
    return this.model.findOne({ paystackReference: reference }).lean();
  }

  async findByQuotationId(quotationId: string): Promise<Payment | null> {
    return this.model.findOne({ quotation: new Types.ObjectId(quotationId) }).lean();
  }

  async updateByReference(
    reference: string,
    payload: Partial<Payment>,
  ): Promise<Payment | null> {
    return this.model
      .findOneAndUpdate({ paystackReference: reference }, { $set: payload }, { new: true })
      .lean();
  }

  async updateById(id: string, payload: Partial<Payment>): Promise<Payment | null> {
    return this.model.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
  }
}
