import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderItem } from '../models/order-item.model';

@Injectable()
export class OrderItemRepository {
  constructor(@InjectModel(OrderItem.name) private readonly model: Model<OrderItem>) {}

  async create(payload: Partial<OrderItem>): Promise<OrderItem> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async createMany(payloads: Partial<OrderItem>[]): Promise<OrderItem[]> {
    return this.model.insertMany(payloads);
  }

  async findByOrder(orderId: string): Promise<OrderItem[]> {
    return this.model.find({ order: new Types.ObjectId(orderId) }).populate('product').lean();
  }

  async deleteByOrder(orderId: string): Promise<void> {
    await this.model.deleteMany({ order: new Types.ObjectId(orderId) });
  }

  async findById(id: string): Promise<OrderItem | null> {
    return this.model.findById(id).lean();
  }

  async update(id: string, payload: Partial<OrderItem>): Promise<OrderItem | null> {
    return this.model.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
  }
}
