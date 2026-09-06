import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { JobType } from 'src/domain/jobs/models/job-type.model';

@Schema()
export class QuestionsBank {
    _id?: Types.ObjectId;

    @Prop({})
    question: string;

    @Prop({ type: Object, default: {} })
    options: {
        A: string;
        B: string;
        C: string;
        D: string;
    };

    @Prop()
    correctAnswer: string;

    @Prop()
    correctOption: string;

    @Prop({ type: Types.ObjectId, ref: 'JobType', required: true })
    jobType: Types.ObjectId;

    @Prop({ type: Boolean, default: true })
    isActive: boolean;
}

export const QuestionsBankSchema = SchemaFactory.createForClass(QuestionsBank);
QuestionsBankSchema.set('timestamps', true);