import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export type NotificationType =
  | 'JOB_MATCHED'
  | 'QUOTE_APPROVED'
  | 'QUOTE_REJECTED'
  | 'QUOTE_REVISED'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_PAID'
  | 'PAYMENT_RELEASED'
  | 'JOB_COMPLETED';

@Schema()
export class Notification {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  userType: string;

  @Prop({ type: String, required: true })
  type: NotificationType;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Object, default: {} })
  data?: Record<string, any>;

  @Prop({ type: Boolean, default: false })
  isRead?: boolean;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.set('timestamps', true);

NotificationSchema.index({ userId: 1, userType: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, userType: 1, isRead: 1 });
