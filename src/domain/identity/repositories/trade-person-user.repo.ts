import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TradePersonUserProfile } from '../models/trade-person-user.model';

@Injectable()
export class TradePersonUserRepository {
  constructor(
    @InjectModel(TradePersonUserProfile.name)
    private readonly model: Model<TradePersonUserProfile>,
  ) {}

  async findById(id: string): Promise<TradePersonUserProfile> {
    return this.model.findById(id);
  }

  async findOne(query: any): Promise<TradePersonUserProfile> {
    return this.model.findOne(query);
  }

  async updateWithUpsert(query: any, payload: any): Promise<TradePersonUserProfile> {
    return this.model.findOneAndUpdate(query, payload, { upsert: true, new: true });
  }

  async save(payload: TradePersonUserProfile) {
    const newProfile = new this.model(payload);
    return newProfile.save();
  }

  // Admin actions (optional)
  async approveById(id: string, approverId: string) {
    return this.model.findByIdAndUpdate(id, { status: 'APPROVED', approvedBy: approverId, approvedAt: new Date() }, { new: true });
  }

  async rejectById(id: string, approverId: string, reason: string) {
    return this.model.findByIdAndUpdate(id, { status: 'REJECTED', approvedBy: approverId, approvedAt: new Date(), rejectionReason: reason }, { new: true });
  }
}
