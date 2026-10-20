import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema()
export class Review {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobRequest', required: true })
  jobRequest: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TradePerson', required: true })
  tradePerson: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'HomeOwner', required: true })
  homeOwner: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ type: String, default: null })
  comment?: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.set('timestamps', true);

ReviewSchema.index({ jobRequest: 1, homeOwner: 1 }, { unique: true });
