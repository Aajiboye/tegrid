import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { TradePerson } from './trade-person-user.model';
import { BankAccounts } from '../dtos/kyc.dto';

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
    healthAndSafetyCertificateExpiryDate?: string;

    @Prop({ type: String})
    healthAndSafetyCertificateIssueDate?: string;

    @Prop({ type: String})
    policeCharacterReportUrl?: string;

    @Prop({ type: BankAccounts, default: [] })
    bankAccounts?: BankAccounts[];

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
