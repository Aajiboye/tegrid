import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HomeOwnerKycProfile } from '../models/homeowner-kyc.model';

@Injectable()
export class HomeOwnerKycRepository {
  constructor(
    @InjectModel(HomeOwnerKycProfile.name)
    private readonly model: Model<HomeOwnerKycProfile>,
  ) {}

  async findById(id: string): Promise<HomeOwnerKycProfile> {
    return this.model.findById(id);
  }

  async findOne(query: any): Promise<HomeOwnerKycProfile> {
    return this.model.findOne(query);
  }

  async update(query: any, payload: any): Promise<HomeOwnerKycProfile> {
    return this.model.findOneAndUpdate(query, payload, { new: true });
  }

  async updateWithUpsert(query: any, payload: any): Promise<HomeOwnerKycProfile> {
    return this.model.findOneAndUpdate(query, payload, { upsert: true });
  }

  async deleteById(id: string): Promise<HomeOwnerKycProfile> {
    return this.model.findByIdAndDelete(id);
  }

  async save(payload: HomeOwnerKycProfile) {
    const newProfile = new this.model(payload);
    return newProfile.save();
  }

  async approveById(id: string, approverId: string) {
    return this.model.findByIdAndUpdate(id, { status: 'APPROVED', approvedBy: approverId, approvedAt: new Date() }, { new: true });
  }

  async rejectById(id: string, approverId: string, reason: string) {
    return this.model.findByIdAndUpdate(id, { status: 'REJECTED', approvedBy: approverId, approvedAt: new Date(), rejectionReason: reason }, { new: true });
  }
}
