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

  /**
   * Creates a new user.
   * @param user - The data for the new user.
   * @returns The created user.
   */
  async create(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const newUser = new this.userModel(user);
    return newUser.save();
  }

  /**
   * Retrieves a user by its unique ID.
   * @param id - The unique ID of the user.
   * @returns The user with the specified ID, or null if not found.
   */
  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Retrieves a user by their email address.
   * @param email - The email address of the user.
   * @returns The user with the specified email, or null if not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Retrieves a user by their email address and includes the password hash.
   * @param email - The email address of the user.
   * @returns The user with the specified email and password hash, or null if not found.
   */
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

  /**
   * Retrieves a user by its unique ID and includes the password hash.
   * @param id - The unique ID of the user.
   * @returns The user with the specified ID and password hash, or null if not found.
   */
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

  /**
   * Retrieves all users.
   * @returns An array of users.
   */
  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  /**
   * Updates a user.
   * @param id - The ID of the user to update.
   * @param userData - The data to update.
   * @returns The updated user or null if not found.
   */
  async update(id: string, userData: Partial<User>): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, userData, { new: true }).exec();
  }

  /**
   * Deletes a user by its unique ID.
   * @param id - The unique ID of the user to delete.
   */
  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }
}
