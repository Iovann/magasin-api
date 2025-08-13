import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IUserRepository } from "./user.repository";
import { MongoUser } from "../entities/mongo-user.entity";
import { User } from "../entities/user.entity";

@Injectable()
export class MongoUserRepository implements IUserRepository {
  constructor(
    @InjectModel(MongoUser.name)
    private readonly userModel: Model<MongoUser>,
  ) {}

  async create(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const newUser = new this.userModel(user);
    return newUser.save();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<(User & { passwordHash: string }) | null> {
    const user = await this.userModel
      .findOne({ email })
      .select("+passwordHash")
      .exec();
    // We must ensure passwordHash is present and return a correctly typed object.
    if (!user || !user.passwordHash) {
      return null;
    }
    return user as User & { passwordHash: string };
  }

  async findByIdWithPassword(
    id: string,
  ): Promise<(User & { passwordHash: string }) | null> {
    const user = await this.userModel
      .findById(id)
      .select("+passwordHash")
      .exec();
    if (!user || !user.passwordHash) {
      return null;
    }
    return user as User & { passwordHash: string };
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, userData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }
}
