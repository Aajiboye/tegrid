import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Material } from './materials.models';
import { Tools } from './tools.models';
import { Workmanship } from './workmanship.model';

@Schema()
export class JobRequestQuotation {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobRequest', required: true })
  jobRequest: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TradePerson' })
  tradePerson?: Types.ObjectId;

  @Prop({ type: [Material], default: [] })
  materials: Material[];

  @Prop({ type: [Tools], default: [] })
  tools: Tools[];

  @Prop({ type: [Workmanship], default: [] })
  workmanships: Workmanship[];

  @Prop({ type: String, unique: true})
  quoteId?: string;

   @Prop({ type: String, default: 'PENDING' })
   reviewStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export const JobRequestQuotationSchema = SchemaFactory.createForClass(JobRequestQuotation);
JobRequestQuotationSchema.set('timestamps', true);