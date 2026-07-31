import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Admin } from '../models/admin.model';

@Injectable()
export class AdminRepository {
  constructor(@InjectModel(Admin.name) private readonly adminModel: Model<Admin>) {}

  async findOne(query: Partial<Admin>) {
    return this.adminModel.findOne(query).lean();
  }

  async save(admin: Partial<Admin>) {
    const doc = new this.adminModel(admin);
    return doc.save();
  }

  async update(query: Partial<Admin>, update: Partial<Admin>) {
    return this.adminModel.findOneAndUpdate(query as any, update as any, { new: true });
  }

  async deleteById(id: string | Types.ObjectId) {
    return this.adminModel.findByIdAndDelete(id as any);
  }
}
