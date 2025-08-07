import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from './user.entity';
import { Role } from '../../../common/enum/role.enum';

@Schema({ timestamps: true, collection: 'users' })
export class MongoUser extends Document implements User {
  declare id: string;
  
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash?: string;

@Prop({ type: String, enum: Role, required: true })
  role: Role;

  createdAt: Date;
}

export const MongoUserSchema = SchemaFactory.createForClass(MongoUser);

MongoUserSchema.virtual('id').get(function () {
  return (this._id as any).toHexString();
});

MongoUserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    // Suppression conditionnelle du passwordHash s'il existe
    if ('passwordHash' in ret) {
      delete ret.passwordHash;
    }
  },
});
