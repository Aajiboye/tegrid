import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema() 
export class Workmanship {
  @Prop({ required: true })
  description: string;

  @Prop({ required: false })
  price?: number;
}
export const WorkmanshipSchema = SchemaFactory.createForClass(Workmanship);