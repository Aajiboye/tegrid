import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema() 
export class Tools {
  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  materialCode: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: false })
  unitPrice?: number;

  @Prop({ required: true })
  vat: number;
}
export const ToolsSchema = SchemaFactory.createForClass(Tools);