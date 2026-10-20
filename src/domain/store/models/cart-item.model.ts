import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Product } from './product.model';
import { ProductType } from '../enums/product-type.enum';

@Schema()
export class CartItem {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Cart', required: true })
  cart: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  product: Types.ObjectId;

  @Prop({ type: String, enum: ProductType, required: true })
  type: ProductType;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: Date, default: null })
  rentalStart?: Date | null;

  @Prop({ type: Date, default: null })
  rentalEnd?: Date | null;

  @Prop({ type: Number, default: null })
  rentalDuration?: number | null;

  @Prop({ type: Number, required: true })
  unitPrice: number;

  @Prop({ type: String, required: true, uppercase: true, trim: true })
  currency: string;

  @Prop({ type: Date, default: Date.now })
  reservedAt?: Date;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);
CartItemSchema.set('timestamps', true);

CartItemSchema.index({ cart: 1 });
CartItemSchema.index({ product: 1 });
