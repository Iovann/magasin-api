import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from './user.entity';
import { Role } from '../../../common/enum/role.enum';

@Schema({ timestamps: true, collection: 'users' })
export class MongoUser extends Document implements User {
  declare id: string;
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ type: [String], enum: Role, default: [] })
  roles: Role[];

  createdAt: Date;
}

export const MongoUserSchema = SchemaFactory.createForClass(MongoUser);

MongoUserSchema.virtual('id').get(function () {
  return (this._id as any).toHexString();
});

MongoUserSchema.set('toJSON', { virtuals: true });
MongoUserSchema.set('toObject', { virtuals: true });
