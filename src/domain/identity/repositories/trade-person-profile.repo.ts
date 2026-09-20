import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TradePersonProfile } from '../models/trade-person-profile.model';

@Injectable()
export class TradePersonProfileRepository {
  constructor(
    @InjectModel(TradePersonProfile.name)
    private readonly model: Model<TradePersonProfile>,
  ) {}

  async findOne(query: any): Promise<TradePersonProfile> {
    return this.model.findOne(query)
      .populate('portfolio.projectCategory')
      .lean();
  }

  async findByUserId(userId: string): Promise<TradePersonProfile> {
    return this.model.findOne({ user: new Types.ObjectId(userId) })
      .populate('portfolio.projectCategory')
      .lean();
  }

  async updateWithUpsert(query: any, payload: any): Promise<TradePersonProfile> {
    return this.model.findOneAndUpdate(query, { $set: payload }, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }).lean();
  }

  async upsertByUserId(userId: string, payload: Partial<TradePersonProfile>): Promise<TradePersonProfile> {
    return this.updateWithUpsert({ user: new Types.ObjectId(userId) }, payload);
  }
}
