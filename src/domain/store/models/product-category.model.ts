import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema()
export class ProductCategory {
  _id?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  slug: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  image?: string;

  @Prop({ type: Boolean, default: true })
  isActive?: boolean;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ProductCategorySchema = SchemaFactory.createForClass(ProductCategory);
ProductCategorySchema.set('timestamps', true);
