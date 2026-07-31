import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export enum JobVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
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

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ type: String, enum: JobVisibility, default: JobVisibility.PUBLIC })
  visibility: JobVisibility;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  tradespersonId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const JobRequestSchema = SchemaFactory.createForClass(JobRequest);
JobRequestSchema.set('timestamps', true);
