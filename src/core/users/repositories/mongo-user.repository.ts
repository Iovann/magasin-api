import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ClientSession, Model } from "mongoose";
import { IUserRepository, TransactionalSession } from "./user.repository";
import { MongoUser } from "../entities/mongo-user.entity";
import { User } from "../entities/user.entity";

@Injectable()
export class MongoUserRepository implements IUserRepository {
  constructor(
    @InjectModel(MongoUser.name)
    private readonly userModel: Model<MongoUser>,
  ) {}

  async create(
    user: Omit<User, "id" | "createdAt">,
    session?: TransactionalSession,
  ): Promise<User> {
    const newUser = new this.userModel(user);
    const savedUser = await newUser.save({ session: session as ClientSession });
    return this.toUserEntity(savedUser);
  }

  async findById(
    id: string,
    session?: TransactionalSession,
  ): Promise<User | null> {
    const user = await this.userModel
      .findById(id)
      .session(session as ClientSession)
      .exec();
    return user ? this.toUserEntity(user) : null;
  }

  async findByEmail(
    email: string,
    session?: TransactionalSession,
  ): Promise<User | null> {
    const user = await this.userModel
      .findOne({ email })
      .session(session as ClientSession)
      .exec();
    return user ? this.toUserEntity(user) : null;
  }

  async findAll(session?: TransactionalSession): Promise<User[]> {
    const users = await this.userModel.find().session(session as ClientSession).exec();
    return users.map((user) => this.toUserEntity(user));
  }

  async delete(id: string, session?: TransactionalSession): Promise<void> {
    await this.userModel
      .findByIdAndDelete(id)
      .session(session as ClientSession)
      .exec();
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<(User & { passwordHash: string }) | null> {
    const user = await this.userModel
      .findOne({ email })
      .select("+passwordHash")
      .exec();
    if (!user || !user.passwordHash) return null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      passwordHash: user.passwordHash,
    };
  }

  private toUserEntity(mongoUser: MongoUser): User {
    return {
      id: mongoUser.id,
      email: mongoUser.email,
      role: mongoUser.role,
      createdAt: mongoUser.createdAt,
    };
  }
}
