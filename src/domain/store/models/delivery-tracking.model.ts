import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ _id: false })
class TrackingUpdate {
  @Prop({ type: String, required: true })
  status: string;

  @Prop({ type: String, default: '' })
  note?: string;

  @Prop({ type: Date, default: Date.now })
  at?: Date;
}

const TrackingUpdateSchema = SchemaFactory.createForClass(TrackingUpdate);

@Schema()
export class DeliveryTracking {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, unique: true })
  order: Types.ObjectId;

  @Prop({ type: String, default: 'PENDING' })
  status?: string;

  @Prop({ type: String, default: null })
  carrier?: string | null;

  @Prop({ type: String, default: null })
  trackingNumber?: string | null;

  @Prop({ type: [TrackingUpdateSchema], default: [] })
  updates?: TrackingUpdate[];

  @Prop({ type: Date, default: null })
  deliveredAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'Admin', default: null })
  deliveredBy?: Types.ObjectId | null;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const DeliveryTrackingSchema = SchemaFactory.createForClass(DeliveryTracking);
DeliveryTrackingSchema.set('timestamps', true);

DeliveryTrackingSchema.index({ order: 1 });
