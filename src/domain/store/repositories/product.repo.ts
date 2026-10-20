import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Product } from '../models/product.model';
import { ProductStatus } from '../enums/product-status.enum';

export interface ProductListQuery {
  status?: ProductStatus;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  type?: string;
  page?: number;
  size?: number;
}

@Injectable()
export class ProductRepository {
  constructor(@InjectModel(Product.name) private readonly model: Model<Product>) {}

  async create(payload: Partial<Product>): Promise<Product> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async findById(id: string): Promise<Product | null> {
    return this.model.findById(id).populate('category').lean();
  }

  async findByIdRaw(id: string): Promise<Product | null> {
    return this.model.findById(id).lean();
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.model.findOne({ sku: sku.toUpperCase() }).lean();
  }

  async update(id: string, payload: Partial<Product>): Promise<Product | null> {
    return this.model.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
  }

  async findWithFilters(query: ProductListQuery): Promise<{ items: Product[]; total: number }> {
    const filter: FilterQuery<Product> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.category) {
      filter.category = new Types.ObjectId(query.category);
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const page = Math.max(1, query.page || 1);
    const size = Math.max(1, query.size || 20);
    const skip = (page - 1) * size;

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(size)
        .lean(),
      this.model.countDocuments(filter),
    ]);

    return { items, total };
  }

  async updateStockReservation(productId: string, purchaseDelta: number, rentalDelta: number): Promise<Product | null> {
    return this.model
      .findByIdAndUpdate(
        productId,
        {
          $inc: {
            availableForPurchase: purchaseDelta,
            'rentalConfig.quantity': rentalDelta,
          },
        },
        { new: true },
      )
      .lean();
  }

  async atomicReservePurchase(productId: string, quantity: number): Promise<Product | null> {
    return this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(productId), availableForPurchase: { $gte: quantity } },
        { $inc: { availableForPurchase: -quantity } },
        { new: true },
      )
      .lean();
  }

  async atomicReleasePurchase(productId: string, quantity: number): Promise<Product | null> {
    return this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(productId) },
        { $inc: { availableForPurchase: quantity } },
        { new: true },
      )
      .lean();
  }

  async atomicReserveRental(productId: string, quantity: number): Promise<Product | null> {
    return this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(productId), 'rentalConfig.quantity': { $gte: quantity } },
        { $inc: { 'rentalConfig.quantity': -quantity } },
        { new: true },
      )
      .lean();
  }

  async atomicReleaseRental(productId: string, quantity: number): Promise<Product | null> {
    return this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(productId) },
        { $inc: { 'rentalConfig.quantity': quantity } },
        { new: true },
      )
      .lean();
  }
}
