import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export type MessageType = 'GENERAL' | 'JOB';

@Schema()
export class Message {
  _id?: Types.ObjectId;

  @Prop({ type: String, enum: ['GENERAL', 'JOB'], required: true })
  type: MessageType;

  @Prop({ type: Types.ObjectId, ref: 'JobRequest', default: null })
  jobRequest?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  sender: Types.ObjectId;

  @Prop({ type: String, required: true })
  senderType: string;

  @Prop({ type: Types.ObjectId, required: true })
  recipient: Types.ObjectId;

  @Prop({ type: String, required: true })
  recipientType: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Boolean, default: false })
  isRead?: boolean;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.set('timestamps', true);

MessageSchema.index({ recipient: 1, createdAt: -1 });
MessageSchema.index({ jobRequest: 1, createdAt: -1 });
