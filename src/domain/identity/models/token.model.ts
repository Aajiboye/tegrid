import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema()
export class Token {
  _id?: Types.ObjectId;

  @Prop()
  otp: string;

  @Prop()
  userId: string;

  @Prop()
  expiresAt: Date;

  @Prop({ type: String, enum: ['RESET_PASSWORD', 'ONBOARDING'] })
  tokenType: string;
}

export const TokenSchema = SchemaFactory.createForClass(Token);

TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
TokenSchema.set('timestamps', true);
