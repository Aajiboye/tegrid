import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ShippingAddress } from '../models/shipping-address.model';
import { UserType } from 'src/domain/identity/enums/user-types.enum';

@Injectable()
export class ShippingAddressRepository {
  constructor(@InjectModel(ShippingAddress.name) private readonly model: Model<ShippingAddress>) {}

  async create(payload: Partial<ShippingAddress>): Promise<ShippingAddress> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async findById(id: string): Promise<ShippingAddress | null> {
    return this.model.findById(id).lean();
  }

  async findByUser(userId: string, userType: UserType): Promise<ShippingAddress[]> {
    return this.model
      .find({ user: new Types.ObjectId(userId), userType })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
  }

  async findDefaultByUser(userId: string, userType: UserType): Promise<ShippingAddress | null> {
    return this.model.findOne({ user: new Types.ObjectId(userId), userType, isDefault: true }).lean();
  }

  async update(id: string, payload: Partial<ShippingAddress>): Promise<ShippingAddress | null> {
    return this.model.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
  }

  async deleteById(id: string): Promise<ShippingAddress | null> {
    return this.model.findByIdAndDelete(id).lean();
  }

  async clearDefaultByUser(userId: string, userType: UserType): Promise<void> {
    await this.model.updateMany(
      { user: new Types.ObjectId(userId), userType },
      { $set: { isDefault: false } },
    );
  }
}
