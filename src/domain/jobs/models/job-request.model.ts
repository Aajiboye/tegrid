import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export enum JobVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum JobStatus {
  OPEN = 'OPEN',
  QUOTATION_PAID = 'QUOTATION_PAID',
  COMPLETED = 'COMPLETED',
}

@Schema()
export class JobRequest {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobType', required: true })
  jobType: Types.ObjectId;

  @Prop({ trim: true })
  title: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Number, required: false })
  budget?: number;

  @Prop({ type: String, default: 'NGN' })
  currency?: string;

  @Prop({ type: Date })
  preferredDate?: Date;

  @Prop({ type: String })
  preferredTime?: string;

  @Prop({ type: String })
  homeAddress: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: [Number],
  })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ type: String, enum: JobVisibility, default: JobVisibility.PUBLIC })
  visibility: JobVisibility;

  @Prop({ type: Types.ObjectId, ref: 'TradePerson', required: false })
  tradespersonId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'HomeOwner', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: String, enum: JobStatus, default: JobStatus.OPEN })
  status?: JobStatus;

  @Prop({ type: String, default: null })
  verificationCode?: string;

  @Prop({ type: Date, default: null })
  verificationCodeGeneratedAt?: Date;

  @Prop({ type: Date, default: null })
  jobCompletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'HomeOwner', default: null })
  jobCompletedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TradePerson', default: null })
  jobCompletionRequestedBy?: Types.ObjectId;

  @Prop({ type: Date, default: null })
  qaApprovedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Admin', default: null })
  qaApprovedBy?: Types.ObjectId;

  @Prop({ type: Date, default: null })
  satisfactoryPeriodEndsAt?: Date;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const JobRequestSchema = SchemaFactory.createForClass(JobRequest);
JobRequestSchema.set('timestamps', true);
JobRequestSchema.index({ location: '2dsphere' });
