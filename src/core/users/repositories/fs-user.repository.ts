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
   * Initializes the repository by loading data from the file.
   */
  async onModuleInit() {
    await this.loadData();
  }

  /**
   * Loads user data from the JSON file.
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
   * Writes the current user data to the JSON file.
   * @private
   */
  private async persist(): Promise<void> {
    await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
  }

  /**
   * Creates a new user and saves it to the file.
   * @param user - The user data to create.
   * @returns The newly created user.
   */
  async create(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const newUser: User = {
      id: randomUUID(),
      ...user,
      createdAt: new Date(),
    };
    this.data.push(newUser);
    await this.persist();
    return newUser;
  }

  /**
   * Finds a user by their ID.
   * @param id - The ID of the user.
   * @returns The user or null if not found.
   */
  async findById(id: string): Promise<User | null> {
    return this.data.find((u) => u.id === id) || null;
  }

  /**
   * Finds a user by their email address.
   * @param email - The email of the user.
   * @returns The user or null if not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.data.find((u) => u.email === email) || null;
  }

  /**
   * Finds all users.
   * @returns A list of all users.
   */
  async findAll(): Promise<User[]> {
    return [...this.data];
  }

  /**
   * Deletes a user by their ID.
   * @param id - The ID of the user to delete.
   */
  async delete(id: string): Promise<void> {
    const initialLength = this.data.length;
    this.data = this.data.filter((u) => u.id !== id);
    if (this.data.length < initialLength) {
      await this.persist();
    }
  }
}
