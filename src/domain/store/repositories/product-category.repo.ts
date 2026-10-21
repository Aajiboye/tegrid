import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductCategory } from '../models/product-category.model';

@Injectable()
export class ProductCategoryRepository {
  constructor(@InjectModel(ProductCategory.name) private readonly model: Model<ProductCategory>) {}

  async create(payload: Partial<ProductCategory>): Promise<ProductCategory> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async findById(id: string): Promise<ProductCategory | null> {
    return this.model.findById(id).lean();
  }

  async findBySlug(slug: string): Promise<ProductCategory | null> {
    return this.model.findOne({ slug: slug.toLowerCase() }).lean();
  }

  async findAllActive(): Promise<ProductCategory[]> {
    return this.model.find({ isActive: true }).sort({ name: 1 }).lean();
  }

  async findAll(): Promise<ProductCategory[]> {
    return this.model.find().sort({ name: 1 }).lean();
  }

  async update(id: string, payload: Partial<ProductCategory>): Promise<ProductCategory | null> {
    return this.model.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
  }

  async deleteById(id: string): Promise<ProductCategory | null> {
    return this.model.findByIdAndDelete(id).lean();
  }

  async findOrCreateDefaultCategories(categories: { name: string; slug: string; description?: string }[]): Promise<void> {
    for (const category of categories) {
      const existing = await this.model.findOne({ slug: category.slug }).lean();
      if (!existing) {
        await this.create(category);
      }
    }
  }
}
