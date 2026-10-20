import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UserType } from 'src/domain/identity/enums/user-types.enum';
import { CartStatus } from '../enums/cart-status.enum';

@Schema()
export class Cart {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: UserType, required: true })
  userType: UserType;

  @Prop({ type: String, enum: CartStatus, default: CartStatus.ACTIVE })
  status?: CartStatus;

  @Prop({ type: String, required: true, uppercase: true, trim: true })
  currency: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
CartSchema.set('timestamps', true);

CartSchema.index({ user: 1, userType: 1, status: 1 });
CartSchema.index({ expiresAt: 1, status: 1 });
