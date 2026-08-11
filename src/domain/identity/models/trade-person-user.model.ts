import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from './user.model';

@Schema()
export class TradePersonUserProfile {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user?: User;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  businessName?: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  contactName?: string;

  @Prop()
  photoIdUrl?: string;

  @Prop()
  address?: string;

  @Prop()
  addressProofUrl?: string;

  // identity fields (encrypted)
  @Prop()
  identityType?: string;

  @Prop()
  identityData?: string;

  @Prop({ default: false })
  phoneVerified?: boolean;

  @Prop({ default: false })
  profileCompleted?: boolean;
}

export const TradePersonUserProfileSchema = SchemaFactory.createForClass(TradePersonUserProfile);
TradePersonUserProfileSchema.set('timestamps', true);
