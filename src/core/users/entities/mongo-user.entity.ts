import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { User } from "./user.entity";
import { Role } from "../../../common/enum/role.enum";

/**
 * Represents a User entity for MongoDB.
 */
@Schema({ timestamps: true, collection: "users" })
export class MongoUser extends Document implements User {
  /**
   * The unique identifier of the user (from MongoDB's _id).
   */
  declare id: string;

  /**
   * The user's email address (must be unique).
   */
  @Prop({ required: true, unique: true, index: true })
  email: string;

  /**
   * The user's hashed password.
   * This field is not selected by default in queries.
   */
  @Prop({ required: true, select: false })
  passwordHash?: string;

  /**
   * The user's role.
   */
  @Prop({ type: String, enum: Role, required: true })
  role: Role;

  /**
   * The creation date of the user.
   */
  createdAt: Date;
}

export const MongoUserSchema = SchemaFactory.createForClass(MongoUser);

// Create a virtual 'id' field that gets the string representation of '_id'.
MongoUserSchema.virtual("id").get(function () {
  return (this._id as any).toHexString();
});

// Ensure virtuals are included and transform the output object.
MongoUserSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    // Conditionally delete the passwordHash if it exists.
    if ("passwordHash" in ret) {
      delete ret.passwordHash;
    }
  },
});
