import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { HomeOwner } from './home-owner-user.model';

@Schema()
export class PhoneNumberVerification {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'HomeOwner' })
  user: HomeOwner;

  @Prop()
  phoneNumber: string;

  @Prop()
  verified: boolean;
}

export const PhoneNumberVerificationSchema = SchemaFactory.createForClass(PhoneNumberVerification);

PhoneNumberVerificationSchema.set('timestamps', true);

