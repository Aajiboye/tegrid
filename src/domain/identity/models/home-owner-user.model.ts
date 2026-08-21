import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Role } from '../enums/roles.enum';
import { UserType } from '../enums/user-types.enum';

@Schema()
export class HomeOwner {
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

  @Prop({ type: String, enum: UserType, default: UserType.HomeOwner })
  userType: UserType;

  @Prop()
  password: string;

  accessToken?: string;

  @Prop({ type: Boolean, default: false })
  isVerified?: boolean;

  
  @Prop({ type: String, default: null })
  firebaseUid: string;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;

  @Prop({ type: String, default: null })
  deletedBy?: string;

  @Prop({ type: String, default: null })
  deletionReason?: string;
}

export const HomeOwnerSchema = SchemaFactory.createForClass(HomeOwner);

HomeOwnerSchema.set('timestamps', true);

// Create partial unique indexes so that documents with null/empty emails or phoneNumbers
// do not violate uniqueness. The index only applies when the field is a non-empty string.
HomeOwnerSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: 'string', $ne: '' } },
  },
);

HomeOwnerSchema.index(
  { phoneNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { phoneNumber: { $type: 'string', $ne: '' } },
  },
);
