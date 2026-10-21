import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Product } from './product.model';
import { RentalStatus } from '../enums/rental-status.enum';

@Schema()
export class RentalReservation {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'OrderItem', required: true })
  orderItem: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  product: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: Date, required: true })
  rentalStart: Date;

  @Prop({ type: Date, required: true })
  rentalEnd: Date;

  @Prop({ type: String, enum: RentalStatus, default: RentalStatus.RESERVED })
  status?: RentalStatus;

  @Prop({ type: Date, default: null })
  returnRequestedAt?: Date | null;

  @Prop({ type: Date, default: null })
  returnConfirmedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'Admin', default: null })
  returnConfirmedBy?: Types.ObjectId | null;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const RentalReservationSchema = SchemaFactory.createForClass(RentalReservation);
RentalReservationSchema.set('timestamps', true);

RentalReservationSchema.index({ product: 1, rentalStart: 1, rentalEnd: 1, status: 1 });
RentalReservationSchema.index({ order: 1 });
RentalReservationSchema.index({ orderItem: 1 });
