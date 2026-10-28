import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema()
export class DeviceToken {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  userType: string;

  @Prop({ type: String, required: true })
  token: string;

  @Prop({ type: String, required: true, default: 'onesignal' })
  provider: string;

  @Prop({ type: String })
  platform?: string;

  @Prop({ type: Boolean, default: true })
  isActive?: boolean;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken);
DeviceTokenSchema.set('timestamps', true);

DeviceTokenSchema.index({ userId: 1, userType: 1, provider: 1 });
DeviceTokenSchema.index({ token: 1 }, { unique: true });
