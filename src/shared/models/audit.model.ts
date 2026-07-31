import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class AuditLog {
  _id?: Types.ObjectId;

  @Prop({ type: String })
  action: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  actor?: any; // user who performed the action

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  payload?: any;

  @Prop({ type: String, default: null })
  metadata?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.set('timestamps', true);
