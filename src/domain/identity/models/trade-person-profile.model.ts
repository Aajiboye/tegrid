import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { TradePerson } from './trade-person-user.model';
import { JobType } from 'src/domain/jobs/models/job-type.model';

@Schema()
export class TradePersonProfile {
    _id?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'TradePerson' })
    user: TradePerson;

    @Prop({
        trim: true,
    })
    businessName: string;

    @Prop({
    })
    serviceDescription: string;

    @Prop({
    })
    yearsOfExperience: number;

     @Prop({
    })
    profileAvatar: string;

    @Prop({
    })
    skills: string[];

    @Prop({
    })
    schedule: [{
        day: string;
        startTime: string;
        endTime: string;
    }];

    @Prop([{
        projectTitle: { type: String },
        projectDescription: { type: String },
        projectCategory: { type: Types.ObjectId, ref: 'JobType' },
        images: [{ type: String }],
    }])
    portfolio: [{
        projectTitle: string;
        projectDescription: string;
        projectCategory: JobType;
        images: string[];
    }]
}


export const TradePersonProfileSchema = SchemaFactory.createForClass(TradePersonProfile);
TradePersonProfileSchema.set('timestamps', true);