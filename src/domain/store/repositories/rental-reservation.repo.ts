import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RentalReservation } from '../models/rental-reservation.model';
import { RentalStatus } from '../enums/rental-status.enum';

@Injectable()
export class RentalReservationRepository {
  constructor(@InjectModel(RentalReservation.name) private readonly model: Model<RentalReservation>) {}

  async create(payload: Partial<RentalReservation>): Promise<RentalReservation> {
    const doc = new this.model(payload);
    return doc.save();
  }

  async createMany(payloads: Partial<RentalReservation>[]): Promise<RentalReservation[]> {
    return this.model.insertMany(payloads) as unknown as RentalReservation[];
  }

  async findById(id: string): Promise<RentalReservation | null> {
    return this.model.findById(id).lean();
  }

  async findByOrder(orderId: string): Promise<RentalReservation[]> {
    return this.model.find({ order: new Types.ObjectId(orderId) }).lean();
  }

  async findByOrderItem(orderItemId: string): Promise<RentalReservation[]> {
    return this.model.find({ orderItem: new Types.ObjectId(orderItemId) }).lean();
  }

  async findActiveByProduct(productId: string, start: Date, end: Date): Promise<RentalReservation[]> {
    return this.model
      .find({
        product: new Types.ObjectId(productId),
        status: { $in: [RentalStatus.RESERVED, RentalStatus.ACTIVE] },
        rentalStart: { $lt: end },
        rentalEnd: { $gt: start },
      })
      .lean();
  }

  async updateStatus(
    id: string,
    status: RentalStatus,
    extra?: Partial<RentalReservation>,
  ): Promise<RentalReservation | null> {
    return this.model.findByIdAndUpdate(id, { $set: { status, ...extra } }, { new: true }).lean();
  }

  async confirmReservationsByOrder(orderId: string, status: RentalStatus): Promise<void> {
    await this.model.updateMany(
      { order: new Types.ObjectId(orderId), status: RentalStatus.RESERVED },
      { $set: { status } },
    );
  }
}
