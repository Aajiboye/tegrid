import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DeviceToken } from '../models/device-token.model';

@Injectable()
export class DeviceTokenRepository {
  constructor(@InjectModel(DeviceToken.name) private readonly model: Model<DeviceToken>) {}

  async register(payload: Partial<DeviceToken>): Promise<DeviceToken> {
    const filter = {
      userId: new Types.ObjectId(payload.userId),
      userType: payload.userType,
      token: payload.token,
      provider: payload.provider || 'onesignal',
    };
    const update = {
      ...filter,
      platform: payload.platform,
      isActive: true,
    };
    return this.model.findOneAndUpdate(filter, { $set: update }, { upsert: true, new: true }).lean();
  }

  async findByUser(userId: string, userType: string): Promise<DeviceToken[]> {
    return this.model
      .find({
        userId: new Types.ObjectId(userId),
        userType,
        isActive: true,
      })
      .lean();
  }

  async deactivateToken(token: string): Promise<void> {
    await this.model.updateOne({ token }, { $set: { isActive: false } });
  }
}
