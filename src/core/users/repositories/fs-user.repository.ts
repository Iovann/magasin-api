import { Injectable, OnModuleInit } from "@nestjs/common";
import { promises as fs } from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { IUserRepository } from "./user.repository";
import { User } from "../entities/user.entity";
import { DatabaseConfig } from "../../../config/database.config";

@Injectable()
export class FsUserRepository implements IUserRepository, OnModuleInit {
  private dbPath: string;
  private data: User[] = [];

  constructor(private readonly dbConfig: DatabaseConfig) {
    this.dbPath = path.resolve(this.dbConfig.dbPath, "users.json");
  }

  /**
   * Initializes the repository by loading data from the database.
   */
  async onModuleInit() {
    await this.loadData();
  }

  /**
   * Converts a user to a public user by removing sensitive information.
   * @param user - The user to convert.
   * @returns The public user.
   */
  private toPublicUser(user: User): User {
    const publicUser = { ...user };
    delete publicUser.passwordHash;
    delete publicUser.refreshToken;
    return publicUser;
  }

  /**
   * Loads data from the JSON file.
   * Creates the file if it does not exist.
   * @private
   */
  private async loadData(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      const fileContent = await fs.readFile(this.dbPath, "utf-8");
      this.data = JSON.parse(fileContent);
    } catch (error) {
      if (error.code === "ENOENT") {
        this.data = [];
        await this.persist();
      } else {
        throw error;
      }
    }
  }

  /**
   * Writes the current data to the JSON file.
   * @private
   */
  private async persist(): Promise<void> {
    await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
  }

  /**
   * Creates a new user.
   * @param user - The data for the new user.
   * @returns The created user.
   */
  async create(user: Omit<User, "id" | "createdAt">): Promise<User> {
    // FS repository does not support transactions, session is ignored.
    const newUser: User = {
      id: randomUUID(),
      ...user,
      createdAt: new Date(),
    };
    this.data.push(newUser);
    await this.persist();
    return this.toPublicUser(newUser);
  }

  /**
   * Retrieves a user by its unique ID.
   * @param id - The unique ID of the user.
   * @returns The user with the specified ID, or null if not found.
   */
  async findById(id: string): Promise<User | null> {
    const user = this.data.find((u) => u.id === id) || null;
    return user ? this.toPublicUser(user) : null;
  }

  /**
   * Retrieves a user by their email address.
   * @param email - The email address of the user.
   * @returns The user with the specified email, or null if not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = this.data.find((u) => u.email === email) || null;
    return user ? this.toPublicUser(user) : null;
  }

  /**
   * Retrieves a user by their email address and includes the password hash.
   * @param email - The email address of the user.
   * @returns The user with the specified email and password hash, or null if not found.
   */
  async findByEmailWithPassword(
    email: string,
  ): Promise<(User & { passwordHash: string }) | null> {
    const user = this.data.find((u) => u.email === email);
    if (user && user.passwordHash) {
      return user as User & { passwordHash: string };
    }
    return null;
  }

  /**
   * Retrieves a user by its unique ID and includes the password hash.
   * @param id - The unique ID of the user.
   * @returns The user with the specified ID and password hash, or null if not found.
   */
  async findByIdWithPassword(
    id: string,
  ): Promise<(User & { passwordHash: string }) | null> {
    const user = this.data.find((u) => u.id === id);
    if (user && user.passwordHash) {
      return user as User & { passwordHash: string };
    }
    return null;
  }

  /**
   * Retrieves all users.
   * @returns An array of users.
   */
  async findAll(): Promise<User[]> {
    return this.data.map(this.toPublicUser);
  }

  /**
   * Updates a user.
   * @param id - The ID of the user to update.
   * @param userData - The data to update.
   * @returns The updated user or null if not found.
   */
  async update(id: string, userData: Partial<User>): Promise<User | null> {
    const userIndex = this.data.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return null;
    }
    this.data[userIndex] = { ...this.data[userIndex], ...userData };
    await this.persist();
    return this.toPublicUser(this.data[userIndex]);
  }

  /**
   * Deletes a user by its unique ID.
   * @param id - The unique ID of the user to delete.
   */
  async delete(id: string): Promise<void> {
    const initialLength = this.data.length;
    this.data = this.data.filter((u) => u.id !== id);
    if (this.data.length < initialLength) {
      await this.persist();
    }
  }
}
