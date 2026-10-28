import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from '../models/notification.model';
import { PaginatedResponse } from 'src/shared/dtos/pagination';

@Injectable()
export class NotificationRepository {
  constructor(@InjectModel(Notification.name) private readonly model: Model<Notification>) {}

  async create(payload: Partial<Notification>): Promise<Notification> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async findById(id: string): Promise<Notification | null> {
    return this.model.findById(id).lean();
  }

  async findByUser(
    userId: string,
    userType: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {},
  ): Promise<{ items: Notification[]; total: number; unreadCount: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const filter: any = {
      userId: new Types.ObjectId(userId),
      userType,
    };
    if (options.unreadOnly) {
      filter.isRead = false;
    }

    const [items, total, unreadCount] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.model.countDocuments({ userId: new Types.ObjectId(userId), userType }),
      this.model.countDocuments({ userId: new Types.ObjectId(userId), userType, isRead: false }),
    ]);

    return { items, total, unreadCount };
  }

  async markAsRead(id: string, userId: string, userType: string): Promise<Notification | null> {
    return this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId), userType },
        { $set: { isRead: true } },
        { new: true },
      )
      .lean();
  }

  async markAllAsRead(userId: string, userType: string): Promise<void> {
    await this.model.updateMany(
      { userId: new Types.ObjectId(userId), userType, isRead: false },
      { $set: { isRead: true } },
    );
  }
}
