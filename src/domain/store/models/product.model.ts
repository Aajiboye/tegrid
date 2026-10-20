import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductType } from '../enums/product-type.enum';
import { RentalGranularity } from '../enums/rental-granularity.enum';
import { ProductCategory } from './product-category.model';

export class MoneyAmount {
  currencyCode: string;
  amount: number;
}

@Schema({ _id: false })
class MoneyAmountSubdocument {
  @Prop({ type: String, required: true, uppercase: true, trim: true })
  currencyCode: string;

  @Prop({ type: Number, required: true, min: 0 })
  amount: number;
}

const MoneyAmountSchema = SchemaFactory.createForClass(MoneyAmountSubdocument);

@Schema({ _id: false })
class RentalConfigSubdocument {
  @Prop({ type: String, enum: RentalGranularity, required: true })
  granularity: RentalGranularity;

  @Prop({ type: [MoneyAmountSchema], required: true })
  pricePerUnit: MoneyAmountSubdocument[];

  @Prop({ type: Number, default: null, min: 1 })
  minimumDuration?: number | null;

  @Prop({ type: Number, required: true, min: 0 })
  quantity: number;
}

const RentalConfigSchema = SchemaFactory.createForClass(RentalConfigSubdocument);

@Schema()
export class Product {
  _id?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  sku: string;

  @Prop({ type: Types.ObjectId, ref: ProductCategory.name, required: true })
  category: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ type: String, enum: ProductType, required: true })
  type: ProductType;

  @Prop({ type: [MoneyAmountSchema], default: [] })
  prices?: MoneyAmountSubdocument[];

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  stockQuantity: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  availableForPurchase: number;

  @Prop({ type: RentalConfigSchema, default: null })
  rentalConfig?: RentalConfigSubdocument | null;

  @Prop({ type: String, enum: ProductStatus, default: ProductStatus.DRAFT })
  status?: ProductStatus;

  @Prop({ type: String, default: null })
  rejectionReason?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'Admin', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Admin', default: null })
  approvedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  approvedAt?: Date | null;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.set('timestamps', true);

ProductSchema.index({ status: 1, category: 1 });
ProductSchema.index({ status: 1, type: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ name: 'text', description: 'text' });
