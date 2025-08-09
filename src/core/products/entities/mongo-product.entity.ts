import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Product } from "./product.entity";

/**
 * Represents a Product entity for MongoDB.
 */
@Schema({ timestamps: true, collection: "products" })
export class MongoProduct extends Document implements Product {
  /**
   * The unique identifier of the product (from MongoDB's _id).
   */
  declare id: string;

  /**
   * The name of the product.
   */
  @Prop({ required: true })
  name: string;

  /**
   * The model name of the product.
   */
  @Prop({ required: true })
  modelName: string;

  /**
   * The quantity in stock.
   */
  @Prop({ required: true, type: Number })
  quantity: number;

  /**
   * The price of the product.
   */
  @Prop({ required: true, type: Number })
  price: number;

  /**
   * The creation date of the product.
   */
  createdAt: Date;

  /**
   * The last update date of the product.
   */
  updatedAt: Date;
}

export const MongoProductSchema = SchemaFactory.createForClass(MongoProduct);

// Create a virtual 'id' field that gets the string representation of '_id'
MongoProductSchema.virtual("id").get(function (this: Document) {
  return (this._id as any).toHexString();
});

// Ensure virtuals are included in toJSON and toObject outputs
MongoProductSchema.set("toJSON", {
  virtuals: true,
});

MongoProductSchema.set("toObject", {
  virtuals: true,
});
