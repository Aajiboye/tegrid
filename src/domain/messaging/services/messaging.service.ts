import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { PaginatedResponse } from 'src/shared/dtos/pagination';
import { MessageRepository } from '../repositories/message.repo';
import { Message, MessageType } from '../models/message.model';
import { HomeOwner } from '../../identity/models/home-owner-user.model';
import { TradePerson } from '../../identity/models/trade-person-user.model';
import { UserType } from '../../identity/enums/user-types.enum';

type UserProfile = {
  _id: string;
  userName?: string;
  email?: string;
  profileAvatar?: string;
  userType: string;
};

@Injectable()
export class MessagingService {
  constructor(
    private readonly messageRepo: MessageRepository,
    @InjectModel(HomeOwner.name) private readonly homeOwnerModel: Model<HomeOwner>,
    @InjectModel(TradePerson.name) private readonly tradePersonModel: Model<TradePerson>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private mapToDto(doc: any, senderProfile?: UserProfile, recipientProfile?: UserProfile) {
    return {
      _id: doc._id.toString(),
      type: doc.type,
      jobRequest: doc.jobRequest?.toString(),
      sender: doc.senderType === 'SYSTEM' ? 'system' : doc.sender.toString(),
      senderType: doc.senderType,
      senderProfile,
      recipient: doc.recipient.toString(),
      recipientType: doc.recipientType,
      recipientProfile,
      content: doc.content,
      isRead: doc.isRead || false,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
    };
  }

  private emitMessageCreated(message: any) {
    this.eventEmitter.emit('message.created', message);
  }

  private getModelForUserType(userType: string): Model<HomeOwner | TradePerson> | null {
    switch (userType) {
      case UserType.HomeOwner:
        return this.homeOwnerModel;
      case UserType.TradesPerson:
      case 'TRADESPERSON':
        return this.tradePersonModel;
      default:
        return null;
    }
  }

  private async loadProfiles(messages: any[]): Promise<Map<string, UserProfile>> {
    const profiles = new Map<string, UserProfile>();
    const idsByType = new Map<string, Set<string>>();

    for (const msg of messages) {
      for (const side of ['sender', 'recipient']) {
        const type = msg[`${side}Type`];
        const id = msg[side]?.toString();
        if (!id || type === 'SYSTEM') continue;
        if (!idsByType.has(type)) idsByType.set(type, new Set());
        idsByType.get(type)!.add(id);
      }
    }

    for (const [type, ids] of idsByType.entries()) {
      const model = this.getModelForUserType(type);
      if (!model) continue;
      const users = await model
        .find({ _id: { $in: Array.from(ids).map((id) => new Types.ObjectId(id)) } })
        .select('email userName profileAvatar userType')
        .lean();

      for (const user of users) {
        const key = `${type}:${user._id.toString()}`;
        profiles.set(key, {
          _id: user._id.toString(),
          userName: user.userName,
          email: user.email,
          profileAvatar: user.profileAvatar,
          userType: type,
        });
      }
    }

    return profiles;
  }

  private async mapMessagesWithProfiles(messages: any[]) {
    const profiles = await this.loadProfiles(messages);

    return messages.map((msg) => {
      const senderKey = `${msg.senderType}:${msg.sender.toString()}`;
      const recipientKey = `${msg.recipientType}:${msg.recipient.toString()}`;
      const senderProfile = msg.senderType === 'SYSTEM'
        ? { _id: 'system', userName: 'System', email: undefined, profileAvatar: undefined, userType: 'SYSTEM' }
        : profiles.get(senderKey);
      const recipientProfile = profiles.get(recipientKey);
      return this.mapToDto(msg, senderProfile, recipientProfile);
    });
  }

  async sendMessage(
    senderId: string,
    senderType: string,
    recipientId: string,
    recipientType: string,
    content: string,
  ) {
    const message = await this.messageRepo.create({
      type: 'GENERAL' as MessageType,
      sender: new Types.ObjectId(senderId),
      senderType,
      recipient: new Types.ObjectId(recipientId),
      recipientType,
      content,
    });
    const [mapped] = await this.mapMessagesWithProfiles([message]);
    this.emitMessageCreated(mapped);
    return mapped;
  }

  async sendJobMessage(
    senderId: string,
    senderType: string,
    recipientId: string,
    recipientType: string,
    jobRequestId: string,
    content: string,
  ) {
    const message = await this.messageRepo.create({
      type: 'JOB' as MessageType,
      jobRequest: new Types.ObjectId(jobRequestId),
      sender: new Types.ObjectId(senderId),
      senderType,
      recipient: new Types.ObjectId(recipientId),
      recipientType,
      content,
    });
    const [mapped] = await this.mapMessagesWithProfiles([message]);
    this.emitMessageCreated(mapped);
    return mapped;
  }

  async sendSystemJobMessage(
    recipientId: string,
    recipientType: string,
    jobRequestId: string,
    content: string,
  ) {
    const SYSTEM_SENDER_ID = '000000000000000000000000';
    const message = await this.messageRepo.create({
      type: 'JOB' as MessageType,
      jobRequest: new Types.ObjectId(jobRequestId),
      sender: new Types.ObjectId(SYSTEM_SENDER_ID),
      senderType: 'SYSTEM',
      recipient: new Types.ObjectId(recipientId),
      recipientType,
      content,
    });
    const [mapped] = await this.mapMessagesWithProfiles([message]);
    this.emitMessageCreated(mapped);
    return mapped;
  }

  async getJobMessages(jobRequestId: string) {
    const messages = await this.messageRepo.findByJobRequestId(jobRequestId);
    return this.mapMessagesWithProfiles(messages);
  }

  async getInbox(userId: string, page = 1, limit = 20): Promise<PaginatedResponse<any[]>> {
    const skip = (page - 1) * limit;
    const { items, total } = await this.messageRepo.findByRecipient(userId, { skip, limit });
    const pageTotal = Math.ceil(total / limit);
    const response = new PaginatedResponse<any[]>();
    response.page = page;
    response.size = limit;
    response.pageTotal = pageTotal;
    response.hasNext = page < pageTotal;
    response.hasPrevious = page > 1;
    response.data = await this.mapMessagesWithProfiles(items);
    return response;
  }

  async getConversation(
    userId: string,
    otherUserId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<any[]>> {
    const skip = (page - 1) * limit;
    const { items, total } = await this.messageRepo.findConversation(userId, otherUserId, { skip, limit });
    const pageTotal = Math.ceil(total / limit);
    const response = new PaginatedResponse<any[]>();
    response.page = page;
    response.size = limit;
    response.pageTotal = pageTotal;
    response.hasNext = page < pageTotal;
    response.hasPrevious = page > 1;
    response.data = await this.mapMessagesWithProfiles(items);
    return response;
  }

  async markAsRead(messageId: string, userId: string) {
    const message = await this.messageRepo.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    if (message.recipient.toString() !== userId) {
      throw new NotFoundException('Message does not belong to you');
    }
    const updated = await this.messageRepo.markAsRead(messageId);
    const [mapped] = await this.mapMessagesWithProfiles([updated]);
    return mapped;
  }
}
