import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from '../models/message.model';

@Injectable()
export class MessageRepository {
  constructor(@InjectModel(Message.name) private readonly model: Model<Message>) {}

  async create(payload: Partial<Message>): Promise<Message> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async findById(id: string): Promise<Message | null> {
    return this.model.findById(id).lean();
  }

  async findByJobRequestId(jobRequestId: string): Promise<Message[]> {
    return this.model
      .find({ jobRequest: new Types.ObjectId(jobRequestId) })
      .sort({ createdAt: 1 })
      .lean();
  }

  async findByRecipient(
    recipientId: string,
    options: { skip?: number; limit?: number } = {},
  ): Promise<{ items: Message[]; total: number }> {
    const filter = { recipient: new Types.ObjectId(recipientId) };
    const query = this.model.find(filter).sort({ createdAt: -1 });
    if (options.skip) query.skip(options.skip);
    if (options.limit) query.limit(options.limit);
    const [items, total] = await Promise.all([query.lean(), this.model.countDocuments(filter)]);
    return { items, total };
  }

  async findConversation(
    userA: string,
    userB: string,
    options: { skip?: number; limit?: number } = {},
  ): Promise<{ items: Message[]; total: number }> {
    const filter = {
      $or: [
        { sender: new Types.ObjectId(userA), recipient: new Types.ObjectId(userB) },
        { sender: new Types.ObjectId(userB), recipient: new Types.ObjectId(userA) },
      ],
    };
    const query = this.model.find(filter).sort({ createdAt: 1 });
    if (options.skip) query.skip(options.skip);
    if (options.limit) query.limit(options.limit);
    const [items, total] = await Promise.all([query.lean(), this.model.countDocuments(filter)]);
    return { items, total };
  }

  async markAsRead(id: string): Promise<Message | null> {
    return this.model.findByIdAndUpdate(id, { $set: { isRead: true } }, { new: true }).lean();
  }

  async countUnread(recipientId: string): Promise<number> {
    return this.model.countDocuments({ recipient: new Types.ObjectId(recipientId), isRead: false });
  }
}
