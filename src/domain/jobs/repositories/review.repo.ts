import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review } from '../models/review.model';

@Injectable()
export class ReviewRepository {
  constructor(@InjectModel(Review.name) private readonly model: Model<Review>) {}

  async create(payload: Partial<Review>): Promise<Review> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async findById(id: string): Promise<Review | null> {
    return this.model.findById(id).lean();
  }

  async findByJobRequestId(jobRequestId: string): Promise<Review | null> {
    return this.model.findOne({ jobRequest: new Types.ObjectId(jobRequestId) }).lean();
  }

  async findByHomeOwnerAndJobRequest(homeOwnerId: string, jobRequestId: string): Promise<Review | null> {
    return this.model
      .findOne({
        homeOwner: new Types.ObjectId(homeOwnerId),
        jobRequest: new Types.ObjectId(jobRequestId),
      })
      .lean();
  }

  async findByTradePersonId(tradePersonId: string): Promise<Review[]> {
    return this.model
      .find({ tradePerson: new Types.ObjectId(tradePersonId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async getAverageRating(tradePersonId: string): Promise<number> {
    const result = await this.model.aggregate([
      { $match: { tradePerson: new Types.ObjectId(tradePersonId) } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } },
    ]);
    return result[0]?.averageRating || 0;
  }
}
