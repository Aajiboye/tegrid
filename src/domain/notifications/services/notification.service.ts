import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import { PaginatedResponse } from 'src/shared/dtos/pagination';
import { PushService } from 'src/shared/services/push.service';
import { NotificationRepository } from '../repositories/notification.repo';
import { DeviceTokenRepository } from '../repositories/device-token.repo';
import { Notification, NotificationType } from '../models/notification.model';

export interface CreateNotificationInput {
  userId: string;
  userType: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  sendPush?: boolean;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly deviceTokenRepo: DeviceTokenRepository,
    private readonly pushService: PushService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private mapToDto(doc: any) {
    return {
      _id: doc._id.toString(),
      userId: doc.userId.toString(),
      userType: doc.userType,
      type: doc.type,
      title: doc.title,
      message: doc.message,
      data: doc.data || {},
      isRead: doc.isRead || false,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
    };
  }

  async create(input: CreateNotificationInput) {
    const notification = await this.notificationRepo.create({
      userId: new Types.ObjectId(input.userId),
      userType: input.userType,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data || {},
    });

    const mapped = this.mapToDto(notification);

    this.eventEmitter.emit('notification.created', mapped);

    if (input.sendPush !== false) {
      await this.sendPushToUser(input.userId, input.userType, input.title, input.message, input.data);
    }

    return mapped;
  }

  async sendPushToUser(
    userId: string,
    userType: string,
    heading: string,
    message: string,
    data?: Record<string, any>,
  ) {
    const tokens = await this.deviceTokenRepo.findByUser(userId, userType);
    const deviceIds = tokens.map((t) => t.token);
    if (deviceIds.length === 0) return;
    await this.pushService.sendToDeviceIds(deviceIds, heading, message, data);
  }

  async registerDeviceToken(
    userId: string,
    userType: string,
    token: string,
    provider = 'onesignal',
    platform?: string,
  ) {
    const doc = await this.deviceTokenRepo.register({
      userId: new Types.ObjectId(userId),
      userType,
      token,
      provider,
      platform,
    });
    return {
      _id: doc._id.toString(),
      userId: doc.userId.toString(),
      userType: doc.userType,
      token: doc.token,
      provider: doc.provider,
      platform: doc.platform,
      isActive: doc.isActive,
    };
  }

  async getNotifications(
    userId: string,
    userType: string,
    page = 1,
    limit = 20,
    unreadOnly = false,
  ): Promise<PaginatedResponse<any[]>> {
    const { items, total, unreadCount } = await this.notificationRepo.findByUser(userId, userType, {
      page,
      limit,
      unreadOnly,
    });

    const pageTotal = Math.ceil(total / limit);
    const response = new PaginatedResponse<any[]>();
    response.page = page;
    response.size = limit;
    response.pageTotal = pageTotal;
    response.hasNext = page < pageTotal;
    response.hasPrevious = page > 1;
    response.data = items.map((item) => this.mapToDto(item));

    (response as any).unreadCount = unreadCount;
    return response;
  }

  async markAsRead(notificationId: string, userId: string, userType: string) {
    const updated = await this.notificationRepo.markAsRead(notificationId, userId, userType);
    return updated ? this.mapToDto(updated) : null;
  }

  async markAllAsRead(userId: string, userType: string) {
    await this.notificationRepo.markAllAsRead(userId, userType);
  }
}
