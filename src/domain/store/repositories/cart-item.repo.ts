import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CartItem } from '../models/cart-item.model';

@Injectable()
export class CartItemRepository {
  constructor(@InjectModel(CartItem.name) private readonly model: Model<CartItem>) {}

  async create(payload: Partial<CartItem>): Promise<CartItem> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async findById(id: string): Promise<CartItem | null> {
    return this.model.findById(id).populate('product').lean();
  }

  async findByCart(cartId: string): Promise<CartItem[]> {
    return this.model.find({ cart: new Types.ObjectId(cartId) }).populate('product').lean();
  }

  async findByCartRaw(cartId: string): Promise<CartItem[]> {
    return this.model.find({ cart: new Types.ObjectId(cartId) }).lean();
  }

  async update(id: string, payload: Partial<CartItem>): Promise<CartItem | null> {
    return this.model.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
  }

  async deleteById(id: string): Promise<CartItem | null> {
    return this.model.findByIdAndDelete(id).lean();
  }

  async deleteByCart(cartId: string): Promise<void> {
    await this.model.deleteMany({ cart: new Types.ObjectId(cartId) });
  }
}
