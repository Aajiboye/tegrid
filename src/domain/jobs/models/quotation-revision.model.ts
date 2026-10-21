import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Material } from './materials.models';
import { Tools } from './tools.models';
import { Workmanship } from './workmanship.model';

@Schema()
export class QuotationRevision {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobRequestQuotation', required: true })
  quotation: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobRequest', required: true })
  jobRequest: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TradePerson', required: true })
  tradePerson: Types.ObjectId;

  @Prop({ type: Number, required: true })
  revisionNumber: number;

  @Prop({ type: [Material], default: [] })
  materials: Material[];

  @Prop({ type: [Tools], default: [] })
  tools: Tools[];

  @Prop({ type: [Workmanship], default: [] })
  workmanships: Workmanship[];

  @Prop({ type: Number, default: 0 })
  totalAmount?: number;

  @Prop({ type: String, default: null })
  changeReason?: string;
}

export const QuotationRevisionSchema = SchemaFactory.createForClass(QuotationRevision);
QuotationRevisionSchema.set('timestamps', true);
