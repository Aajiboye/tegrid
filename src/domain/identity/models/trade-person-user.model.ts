import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UserType } from '../enums/user-types.enum';
import { Role } from '../enums/roles.enum';
import { JobType } from 'src/domain/jobs/models/job-type.model';

@Schema()
export class TradePerson {
  _id?: Types.ObjectId;

  @Prop({
    trim: true,
    lowercase: true,
  })
  email: string;

  @Prop({
    trim: true,
    lowercase: true,
  })
  phoneNumber: string;

  @Prop({
    trim: true,
  })
  userName?: string;

  @Prop()
  profileAvatar?: string;

  @Prop({ type: String, enum: Role, default: Role.User })
  role: Role;

  @Prop({ type: String, enum: UserType, default: UserType.TradesPerson })
  userType: UserType;

  @Prop()
  password: string;

  accessToken?: string;

  @Prop({ type: Boolean, default: false })
  isVerified?: boolean;


  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
      index: '2dsphere',
    },
  })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop({ type: String})
  locationAddress?: String;

  @Prop({ type: Types.ObjectId, ref: 'JobType', required: false })
  mainTradeCategory?: JobType;

  @Prop({ type: String, default: null })
  firebaseUid?: string;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;

  @Prop({ type: String, default: null })
  deletedBy?: string;

  @Prop({ type: String, default: null })
  deletionReason?: string;
}

export const TradePersonSchema = SchemaFactory.createForClass(TradePerson);
TradePersonSchema.set('timestamps', true);