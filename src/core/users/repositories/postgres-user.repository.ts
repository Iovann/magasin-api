import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IUserRepository } from "./user.repository";
import { PostgresUser } from "../entities/postgres-user.entity";
import { User } from "../entities/user.entity";

/**
 * PostgreSQL implementation of the user repository.
 */
@Injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(PostgresUser)
    private readonly userRepository: Repository<PostgresUser>,
  ) {}

  /**
   * Creates a new user in PostgreSQL.
   * @param user - The user data to create.
   * @returns The created user.
   */
  async create(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  /**
   * Finds a user by their ID in PostgreSQL.
   * @param id - The ID of the user.
   * @returns The user or null if not found.
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  /**
   * Finds a user by their email address in PostgreSQL.
   * @param email - The email of the user.
   * @returns The user or null if not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  /**
   * Finds all users in PostgreSQL.
   * @returns A list of all users.
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  /**
   * Deletes a user by their ID from PostgreSQL.
   * @param id - The ID of the user to delete.
   */
  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
