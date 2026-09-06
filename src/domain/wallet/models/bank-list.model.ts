import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema()
export class BankList {
  _id?: Types.ObjectId;

  @Prop({ trim: true})
  name: string;

  @Prop()
  slug: string;

  @Prop()
  code: string;

  @Prop()
  country: string;

  @Prop()
  currency: string;

  @Prop()
  type: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const BankListSchema = SchemaFactory.createForClass(BankList);
BankListSchema.set('timestamps', true);