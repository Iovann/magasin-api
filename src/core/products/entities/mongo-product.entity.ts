import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from './product.entity';

@Schema({ timestamps: true, collection: 'products' })
export class MongoProduct extends Document implements Product {
  id: string; // virtual getter

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  model: string;

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ default: false })
  isSold: boolean;

  createdAt: Date;
}

export const MongoProductSchema = SchemaFactory.createForClass(MongoProduct);

// Create a virtual 'id' field that gets the string representation of '_id'
MongoProductSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtuals are included in toJSON and toObject outputs
MongoProductSchema.set('toJSON', {
  virtuals: true,
});

MongoProductSchema.set('toObject', {
  virtuals: true,
});
