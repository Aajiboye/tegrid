import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UserType } from 'src/domain/identity/enums/user-types.enum';

export type StorePaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

@Schema()
export class StorePayment {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: UserType, required: true })
  userType: UserType;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, required: true, uppercase: true, trim: true })
  currency: string;

  @Prop({ type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], default: 'PENDING' })
  status?: StorePaymentStatus;

  @Prop({ type: String, required: true, unique: true })
  paystackReference: string;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const StorePaymentSchema = SchemaFactory.createForClass(StorePayment);
StorePaymentSchema.set('timestamps', true);

StorePaymentSchema.index({ order: 1 });
StorePaymentSchema.index({ paystackReference: 1 });
StorePaymentSchema.index({ user: 1, userType: 1 });
