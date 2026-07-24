import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Token } from '../models/token.model';
import { HomeOwnerKycProfile } from '../models/homeowner-kyc.model';
import { PhoneNumberVerification } from '../models/phone-number-verifications.model';

@Injectable()
export class PhoneNumberVerificationRepository {
  constructor(
    @InjectModel(PhoneNumberVerification.name)
    private readonly model: Model<PhoneNumberVerification>,
  ) {}

  async findById(id: string): Promise<PhoneNumberVerification> {
    return this.model.findById(id);
  }

  async findOne(query: any): Promise<PhoneNumberVerification> {
    return this.model.findOne(query);
  }

  async update(query: any, payload: any): Promise<PhoneNumberVerification> {
    return this.model.findOneAndUpdate(query, payload, { new: true });
  }

  async updateWithUpsert(query: any, payload: any): Promise<PhoneNumberVerification> {
    return this.model.findOneAndUpdate(query, payload, { upsert: true });
  }

  async deleteById(id: string): Promise<PhoneNumberVerification> {
    return this.model.findByIdAndDelete(id);
  }

  async save(payload: PhoneNumberVerification) {
    const newProfile = new this.model(payload);
    return newProfile.save();
  }
}
