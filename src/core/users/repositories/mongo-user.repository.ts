import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IUserRepository } from "./user.repository";
import { MongoUser } from "../entities/mongo-user.entity";
import { User } from "../entities/user.entity";

/**
 * MongoDB implementation of the user repository.
 */
@Injectable()
export class MongoUserRepository implements IUserRepository {
  constructor(
    @InjectModel(MongoUser.name)
    private readonly userModel: Model<MongoUser>,
  ) {}

  /**
   * Creates a new user in MongoDB.
   * @param user - The user data to create.
   * @returns The created user.
   */
  async create(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const newUser = new this.userModel(user);
    const savedUser = await newUser.save();
    return this.toUserEntity(savedUser);
  }

  /**
   * Finds a user by their ID in MongoDB.
   * @param id - The ID of the user.
   * @returns The user or null if not found.
   */
  async findById(id: string): Promise<User | null> {
    const user = await this.userModel.findById(id).exec();
    return user ? this.toUserEntity(user) : null;
  }

  /**
   * Finds a user by their email address in MongoDB.
   * @param email - The email of the user.
   * @returns The user or null if not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email }).exec();
    return user ? this.toUserEntity(user) : null;
  }

  /**
   * Finds all users in MongoDB.
   * @returns A list of all users.
   */
  async findAll(): Promise<User[]> {
    const users = await this.userModel.find().exec();
    return users.map((user) => this.toUserEntity(user));
  }

  /**
   * Deletes a user by their ID from MongoDB.
   * @param id - The ID of the user to delete.
   */
  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }

  /**
   * Special method for authentication - includes the passwordHash.
   * Finds a user by email and returns the user object including the password hash.
   * @param email - The email of the user.
   * @returns The user with password hash or null if not found.
   */
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

  /**
   * Private method to transform a Mongoose document into a User entity.
   * This ensures the passwordHash is not exposed by default.
   * @param mongoUser - The Mongoose user document.
   * @returns A User entity object.
   */
  private toUserEntity(mongoUser: MongoUser): User {
    return {
      id: mongoUser.id,
      email: mongoUser.email,
      role: mongoUser.role,
      createdAt: mongoUser.createdAt,
      // passwordHash is intentionally omitted for security
    };
  }
}
