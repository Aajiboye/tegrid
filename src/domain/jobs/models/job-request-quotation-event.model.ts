import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export type QuotationEventType =
  | 'QUOTE_SUBMITTED'
  | 'ADMIN_REVIEW'
  | 'QUOTE_APPROVED'
  | 'QUOTE_REJECTED'
  | 'RESIDENT_PAID';

@Schema()
export class JobRequestQuotationEvent {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobRequestQuotation', required: true })
  quotation: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobRequest', required: true })
  jobRequest: Types.ObjectId;

  @Prop({ type: String, enum: ['QUOTE_SUBMITTED', 'ADMIN_REVIEW', 'QUOTE_APPROVED', 'QUOTE_REJECTED', 'RESIDENT_PAID'], required: true })
  eventType: QuotationEventType;

  @Prop({ type: String, default: null })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'TradePerson', default: null })
  tradePerson?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Admin', default: null })
  performedBy?: Types.ObjectId;

  @Prop({ type: Object, default: null })
  metadata?: Record<string, any>;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const JobRequestQuotationEventSchema = SchemaFactory.createForClass(JobRequestQuotationEvent);
JobRequestQuotationEventSchema.set('timestamps', true);
