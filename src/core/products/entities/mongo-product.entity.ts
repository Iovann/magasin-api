import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Product } from './product.entity';

@Schema({ timestamps: true, collection: 'products' })
export class MongoProduct extends Document implements Product {
  declare id: string;
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  modelName: string;

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ required: true, type: Number })
  price: number;

  createdAt: Date;
  updatedAt: Date;
}

export const MongoProductSchema = SchemaFactory.createForClass(MongoProduct);

// Create a virtual 'id' field that gets the string representation of '_id'
MongoProductSchema.virtual('id').get(function (this: Document) {
  return (this._id as any).toHexString();
});

// Ensure virtuals are included in toJSON and toObject outputs
MongoProductSchema.set('toJSON', {
  virtuals: true,
});

MongoProductSchema.set('toObject', {
  virtuals: true,
});
