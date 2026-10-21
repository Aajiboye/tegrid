import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginatedResponse } from 'src/shared/dtos/pagination';
import { MessageRepository } from '../repositories/message.repo';
import { Message, MessageType } from '../models/message.model';

@Injectable()
export class MessagingService {
  constructor(private readonly messageRepo: MessageRepository) {}

  private mapToDto(doc: any) {
    return {
      _id: doc._id.toString(),
      type: doc.type,
      jobRequest: doc.jobRequest?.toString(),
      sender: doc.sender.toString(),
      senderType: doc.senderType,
      recipient: doc.recipient.toString(),
      recipientType: doc.recipientType,
      content: doc.content,
      isRead: doc.isRead || false,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
    };
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
    return this.mapToDto(message);
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
    return this.mapToDto(message);
  }

  async sendSystemJobMessage(
    recipientId: string,
    recipientType: string,
    jobRequestId: string,
    content: string,
  ) {
    return this.sendJobMessage(
      'system',
      'SYSTEM',
      recipientId,
      recipientType,
      jobRequestId,
      content,
    );
  }

  async getJobMessages(jobRequestId: string) {
    const messages = await this.messageRepo.findByJobRequestId(jobRequestId);
    return messages.map((msg) => this.mapToDto(msg));
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
    response.data = items.map((msg) => this.mapToDto(msg));
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
    response.data = items.map((msg) => this.mapToDto(msg));
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
    return this.mapToDto(updated);
  }
}
