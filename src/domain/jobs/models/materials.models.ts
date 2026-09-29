import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema() 
export class Material {
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
export const MaterialSchema = SchemaFactory.createForClass(Material);