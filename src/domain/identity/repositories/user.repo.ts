import { Injectable } from '@nestjs/common';
import { HomeOwner } from '../models/home-owner-user.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class HomeOwnerRepository {
  constructor(
    @InjectModel(HomeOwner.name)
    private readonly model: Model<HomeOwner>,
  ) {}

  async findById(id: string, options?: { includeDeleted?: boolean }): Promise<HomeOwner > {
    // exclude soft-deleted users by default unless caller asks to include them
    const includeDeleted = !!options && options.includeDeleted === true;
    const query: any = { _id: id };
    if (!includeDeleted) query.deletedAt = null;
    return this.model.findOne(query);
  }

  async findOne(query: any): Promise<HomeOwner> {
    // If caller provided a query that explicitly includes deletedAt or asks
    // for deleted records (by setting __includeDeleted === true), respect it.
    const includeDeleted = !!query && query.__includeDeleted === true;
    if (query && query.__includeDeleted !== undefined) delete query.__includeDeleted;
    const finalQuery = { ...(query || {}) } as any;
    if (!includeDeleted && finalQuery.deletedAt === undefined) finalQuery.deletedAt = null;
    return this.model.findOne(finalQuery);
  }

  async update(query: any, payload: any): Promise<HomeOwner> {
    return this.model.findOneAndUpdate(query, payload, { new: true });
  }

  async softDelete(id: string, payload: { deletedBy?: string; deletionReason?: string }) {
    return this.model.findOneAndUpdate({ _id: id }, { deletedAt: new Date(), deletedBy: payload.deletedBy ?? null, deletionReason: payload.deletionReason ?? null }, { new: true });
  }

  async deleteById(id: string) {
    return this.model.findByIdAndDelete(id);
  }

  async save(payload: HomeOwner) {
    return this.model.create(payload);
  }

  async find(query): Promise<HomeOwner[]> {
    const includeDeleted = !!query && query.__includeDeleted === true;
    if (query && query.__includeDeleted !== undefined) delete query.__includeDeleted;
    const finalQuery = { ...(query || {}) } as any;
    if (!includeDeleted && finalQuery.deletedAt === undefined) finalQuery.deletedAt = null;
    return this.model.find(finalQuery);
    }
}
