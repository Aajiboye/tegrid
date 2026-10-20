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

  async findByRecipient(recipientId: string, options: { skip?: number; limit?: number } = {}): Promise<Message[]> {
    const query = this.model.find({ recipient: new Types.ObjectId(recipientId) }).sort({ createdAt: -1 });
    if (options.skip) query.skip(options.skip);
    if (options.limit) query.limit(options.limit);
    return query.lean();
  }

  async findConversation(
    userA: string,
    userB: string,
    options: { skip?: number; limit?: number } = {},
  ): Promise<Message[]> {
    const query = this.model.find({
      $or: [
        { sender: new Types.ObjectId(userA), recipient: new Types.ObjectId(userB) },
        { sender: new Types.ObjectId(userB), recipient: new Types.ObjectId(userA) },
      ],
    }).sort({ createdAt: 1 });
    if (options.skip) query.skip(options.skip);
    if (options.limit) query.limit(options.limit);
    return query.lean();
  }

  async markAsRead(id: string): Promise<Message | null> {
    return this.model.findByIdAndUpdate(id, { $set: { isRead: true } }, { new: true }).lean();
  }

  async countUnread(recipientId: string): Promise<number> {
    return this.model.countDocuments({ recipient: new Types.ObjectId(recipientId), isRead: false });
  }
}
