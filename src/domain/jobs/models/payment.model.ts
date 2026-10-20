import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'RELEASED';

@Schema()
export class Payment {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobRequestQuotation', required: true })
  quotation: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobRequest', required: true })
  jobRequest: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'HomeOwner', required: true })
  homeOwner: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TradePerson', required: true })
  tradePerson: Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, default: 'NGN' })
  currency?: string;

  @Prop({ type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'RELEASED'], default: 'PENDING' })
  status?: PaymentStatus;

  @Prop({ type: String, required: true, unique: true })
  paystackReference: string;

  @Prop({ type: String, default: null })
  paystackTransferReference?: string;

  @Prop({ type: Number, default: 0 })
  releasedAmount?: number;

  @Prop({ type: Date, default: null })
  releasedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Admin', default: null })
  releasedBy?: Types.ObjectId;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.set('timestamps', true);
