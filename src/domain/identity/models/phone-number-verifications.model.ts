import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from './user.model';

@Schema()
export class PhoneNumberVerification {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: User;

  @Prop()
  phoneNumber: string;

  @Prop()
  verified: boolean;
}

export const PhoneNumberVerificationSchema = SchemaFactory.createForClass(PhoneNumberVerification);

PhoneNumberVerificationSchema.set('timestamps', true);

