import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DeliveryTracking } from '../models/delivery-tracking.model';

@Injectable()
export class DeliveryTrackingRepository {
  constructor(@InjectModel(DeliveryTracking.name) private readonly model: Model<DeliveryTracking>) {}

  async create(payload: Partial<DeliveryTracking>): Promise<DeliveryTracking> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async findByOrder(orderId: string): Promise<DeliveryTracking | null> {
    return this.model.findOne({ order: new Types.ObjectId(orderId) }).lean();
  }

  async addUpdate(orderId: string, status: string, note?: string): Promise<DeliveryTracking | null> {
    return this.model
      .findOneAndUpdate(
        { order: new Types.ObjectId(orderId) },
        { $set: { status }, $push: { updates: { status, note, at: new Date() } } },
        { new: true, upsert: true },
      )
      .lean();
  }

  async updateCarrierInfo(orderId: string, carrier?: string, trackingNumber?: string): Promise<DeliveryTracking | null> {
    const update: any = {};
    if (carrier !== undefined) update.carrier = carrier;
    if (trackingNumber !== undefined) update.trackingNumber = trackingNumber;

    return this.model
      .findOneAndUpdate({ order: new Types.ObjectId(orderId) }, { $set: update }, { new: true, upsert: true })
      .lean();
  }

  async markDelivered(orderId: string, deliveredBy: Types.ObjectId): Promise<DeliveryTracking | null> {
    return this.model
      .findOneAndUpdate(
        { order: new Types.ObjectId(orderId) },
        {
          $set: {
            status: 'DELIVERED',
            deliveredAt: new Date(),
            deliveredBy,
          },
          $push: { updates: { status: 'DELIVERED', note: 'Order delivered', at: new Date() } },
        },
        { new: true, upsert: true },
      )
      .lean();
  }
}
