import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { TradePerson } from './trade-person-user.model';

@Schema()
export class TradePersonKycProfile {
    _id?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'TradePerson' })
    user?: TradePerson;
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
    // identityType is a label for the identity (e.g. 'NIN', 'DRIVERS_LICENSE')
    identityType?: string;

    @Prop()
    // identityData holds the encrypted identity value (e.g. encrypted NIN or license number)
    identityData?: string;

    @Prop()
    photoIdUrl?: string;

    @Prop()
    addressProofUrl?: string;

    @Prop()
    dob?: string;

    @Prop()
    homeAddress?: string;

    @Prop({ type: String})
    healthAndSafetyCertificateUrl?: string;

    @Prop({ type: String})
    policeCharacterReportUrl?: string;

    @Prop({ type: String})
    bankName?: string;

    @Prop({ type: String})
    accountNumber?: string;

    @Prop({ type: String})
    accountName?: string;

    @Prop({ type: String})
    mainTrade?: string;

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

export const TradePersonKycSchema = SchemaFactory.createForClass(TradePersonKycProfile);

TradePersonKycSchema.set('timestamps', true);
