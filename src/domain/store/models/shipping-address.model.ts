import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UserType } from 'src/domain/identity/enums/user-types.enum';

@Schema()
export class ShippingAddress {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: UserType, required: true })
  userType: UserType;

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

  @Prop({ type: Boolean, default: false })
  isDefault?: boolean;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ShippingAddressSchema = SchemaFactory.createForClass(ShippingAddress);
ShippingAddressSchema.set('timestamps', true);

ShippingAddressSchema.index({ user: 1, userType: 1 });
