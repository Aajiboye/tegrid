import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartSchema } from '../models/cart.model';
import { CartStatus } from '../enums/cart-status.enum';
import { UserType } from 'src/domain/identity/enums/user-types.enum';

@Injectable()
export class CartRepository {
  constructor(@InjectModel(Cart.name) private readonly model: Model<Cart>) {}

  async create(payload: Partial<Cart>): Promise<Cart> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async findById(id: string): Promise<Cart | null> {
    return this.model.findById(id).lean();
  }

  async findActiveByUser(userId: string, userType: UserType): Promise<Cart | null> {
    return this.model
      .findOne({ user: new Types.ObjectId(userId), userType, status: CartStatus.ACTIVE })
      .lean();
  }

  async update(id: string, payload: Partial<Cart>): Promise<Cart | null> {
    return this.model.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
  }

  async markStatus(id: string, status: CartStatus): Promise<Cart | null> {
    return this.model.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean();
  }

  async findExpiredActive(): Promise<Cart[]> {
    return this.model
      .find({ status: CartStatus.ACTIVE, expiresAt: { $lt: new Date() } })
      .lean();
  }
}
