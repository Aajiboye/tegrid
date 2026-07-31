import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Role } from '../enums/roles.enum';

@Schema()
export class Admin {
  _id?: Types.ObjectId;

  @Prop({ trim: true, lowercase: true })
  email: string;

  @Prop()
  password: string;

  @Prop({ type: String, enum: Role, default: Role.Admin })
  role: Role;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
AdminSchema.set('timestamps', true);
