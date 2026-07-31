import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema()
export class JobType {
  _id?: Types.ObjectId;

  @Prop({ trim: true })
  title: string;

  @Prop({ type: String, default: '' })
  description?: string;
}

export const JobTypeSchema = SchemaFactory.createForClass(JobType);
JobTypeSchema.set('timestamps', true);
