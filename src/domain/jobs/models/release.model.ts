import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export type ReleaseType = 'INITIAL' | 'BALANCE';
export type ReleaseStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

@Schema()
export class Release {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Payment', required: true })
  payment: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobRequestQuotation', required: true })
  quotation: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobRequest', required: true })
  jobRequest: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TradePerson', required: true })
  tradePerson: Types.ObjectId;

  @Prop({ type: String, enum: ['INITIAL', 'BALANCE'], required: true })
  releaseType: ReleaseType;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, default: 'NGN' })
  currency?: string;

  @Prop({ type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' })
  status?: ReleaseStatus;

  @Prop({ type: String, default: null })
  paystackTransferReference?: string;

  @Prop({ type: Types.ObjectId, ref: 'Admin', default: null })
  releasedBy?: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  reason?: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ReleaseSchema = SchemaFactory.createForClass(Release);
ReleaseSchema.set('timestamps', true);
