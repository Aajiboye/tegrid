import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UserType } from 'src/domain/identity/enums/user-types.enum';
import { OrderStatus } from '../enums/order-status.enum';

@Schema({ _id: false })
class ShippingAddressSnapshot {
  @Prop({ trim: true })
  label?: string;

  @Prop({ required: true, trim: true })
  recipientName: string;

  @Prop({ required: true, trim: true })
  phoneNumber: string;

  @Prop({ required: true, trim: true })
  addressLine1: string;

  @Prop({ trim: true })
  addressLine2?: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  state: string;

  @Prop({ required: true, trim: true })
  country: string;

  @Prop({ trim: true })
  postalCode?: string;
}

const ShippingAddressSnapshotSchema = SchemaFactory.createForClass(ShippingAddressSnapshot);

@Schema()
export class Order {
  _id?: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: UserType, required: true })
  userType: UserType;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING_PAYMENT })
  status?: OrderStatus;

  @Prop({ type: String, required: true, uppercase: true, trim: true })
  currency: string;

  @Prop({ type: Number, required: true })
  subtotal: number;

  @Prop({ type: Number, required: true, default: 0 })
  deliveryFee: number;

  @Prop({ type: Number, required: true })
  totalAmount: number;

  @Prop({ type: ShippingAddressSnapshotSchema, required: true })
  shippingAddress: ShippingAddressSnapshot;

  @Prop({ type: Types.ObjectId, ref: 'StorePayment', default: null })
  payment?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  paidAt?: Date | null;

  @Prop({ type: Date, default: null })
  deliveredAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'Admin', default: null })
  deliveredBy?: Types.ObjectId | null;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.set('timestamps', true);

OrderSchema.index({ user: 1, userType: 1, status: 1 });
OrderSchema.index({ orderNumber: 1 });
