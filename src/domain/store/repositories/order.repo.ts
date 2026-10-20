import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Order } from '../models/order.model';
import { OrderStatus } from '../enums/order-status.enum';
import { UserType } from 'src/domain/identity/enums/user-types.enum';

export interface OrderListQuery {
  status?: OrderStatus;
  userId?: string;
  userType?: UserType;
  page?: number;
  size?: number;
  from?: Date;
  to?: Date;
}

@Injectable()
export class OrderRepository {
  constructor(@InjectModel(Order.name) private readonly model: Model<Order>) {}

  async create(payload: Partial<Order>): Promise<Order> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async findById(id: string): Promise<Order | null> {
    return this.model.findById(id).lean();
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.model.findOne({ orderNumber }).lean();
  }

  async findByUser(userId: string, userType: UserType, query: { page?: number; size?: number }): Promise<{ items: Order[]; total: number }> {
    const page = Math.max(1, query.page || 1);
    const size = Math.max(1, query.size || 20);
    const skip = (page - 1) * size;

    const filter: FilterQuery<Order> = { user: new Types.ObjectId(userId), userType };

    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(size).lean(),
      this.model.countDocuments(filter),
    ]);

    return { items, total };
  }

  async findWithFilters(query: OrderListQuery): Promise<{ items: Order[]; total: number }> {
    const filter: FilterQuery<Order> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.userId) {
      filter.user = new Types.ObjectId(query.userId);
    }

    if (query.userType) {
      filter.userType = query.userType;
    }

    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = query.from;
      if (query.to) filter.createdAt.$lte = query.to;
    }

    const page = Math.max(1, query.page || 1);
    const size = Math.max(1, query.size || 20);
    const skip = (page - 1) * size;

    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(size).lean(),
      this.model.countDocuments(filter),
    ]);

    return { items, total };
  }

  async update(id: string, payload: Partial<Order>): Promise<Order | null> {
    return this.model.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
  }

  async updateStatus(id: string, status: OrderStatus, extra?: Partial<Order>): Promise<Order | null> {
    return this.model.findByIdAndUpdate(id, { $set: { status, ...extra } }, { new: true }).lean();
  }
}
