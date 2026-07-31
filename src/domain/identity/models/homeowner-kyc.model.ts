import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Role } from '../enums/roles.enum';
import { UserType } from '../enums/user-types.enum';
import { User } from './user.model';

@Schema()
export class HomeOwnerKycProfile {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user?: User;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  middleName?: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  pinHash?: string;

  @Prop()
  nin?: string;

  @Prop()
  photoIdUrl?: string;

  @Prop()
  address?: string;

  @Prop()
  addressProofUrl?: string;

  // workflow fields
  @Prop({ type: String, default: 'PENDING' })
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  approvedBy?: any;

  @Prop({ type: Date, default: null })
  approvedAt?: Date;

  @Prop({ type: String, default: null })
  rejectionReason?: string;
}

export const HomeOwnerKycProfileSchema = SchemaFactory.createForClass(HomeOwnerKycProfile);

HomeOwnerKycProfileSchema.set('timestamps', true);

