import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Material } from './materials.models';
import { Tools } from './tools.models';
import { Workmanship } from './workmanship.model';

export type QuotationReviewStatus =
  | 'PENDING'
  | 'ADMIN_APPROVED'
  | 'ADMIN_REJECTED'
  | 'HOMEOWNER_ACCEPTED'
  | 'HOMEOWNER_REJECTED'
  | 'PAYMENT_COMPLETED';

@Schema()
export class JobRequestQuotation {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobRequest', required: true })
  jobRequest: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TradePerson' })
  tradePerson?: Types.ObjectId;

  @Prop({ type: [Material], default: [] })
  materials: Material[];

  @Prop({ type: [Tools], default: [] })
  tools: Tools[];

  @Prop({ type: [Workmanship], default: [] })
  workmanships: Workmanship[];

  @Prop({ type: String, unique: true })
  quoteId?: string;

  @Prop({
    type: String,
    enum: ['PENDING', 'ADMIN_APPROVED', 'ADMIN_REJECTED', 'HOMEOWNER_ACCEPTED', 'HOMEOWNER_REJECTED', 'PAYMENT_COMPLETED'],
    default: 'PENDING',
  })
  reviewStatus?: QuotationReviewStatus;

  @Prop({ type: Number, default: 0 })
  totalAmount?: number;

  @Prop({ type: Number, default: 0 })
  currentRevisionNumber?: number;

  @Prop({ type: String, default: null })
  rejectionReason?: string;

  @Prop({ type: String, default: null })
  paystackRecipientCode?: string;
}

export const JobRequestQuotationSchema = SchemaFactory.createForClass(JobRequestQuotation);
JobRequestQuotationSchema.set('timestamps', true);
