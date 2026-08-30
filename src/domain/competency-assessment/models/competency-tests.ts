import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { JobType } from 'src/domain/jobs/models/job-type.model';

@Schema()
export class CompetencyTest {
    _id?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'TradePerson', required: true })
    tradePersonId: Types.ObjectId;

    @Prop()
    assessmentDate: Date;

    @Prop({ type: [{ questionId: { type: Types.ObjectId, ref: 'QuestionsBank', required: true }, choosenOption: String, correct: Boolean }] })
    assessmentDetails:{
    questionId: Types.ObjectId;
    choosenOption: string;
    correct: boolean;
    }[];

    @Prop()
    assessmentScore: number;

    @Prop()
    passed: boolean;

}

export const CompetencyTestSchema = SchemaFactory.createForClass(CompetencyTest);
CompetencyTestSchema.set('timestamps', true);