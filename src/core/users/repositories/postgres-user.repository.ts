import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IUserRepository } from "./user.repository";
import { PostgresUser } from "../entities/postgres-user.entity";
import { User } from "../entities/user.entity";

@Injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(PostgresUser)
    private readonly userRepository: Repository<PostgresUser>,
  ) {}

  /**
   * Creates a new user.
   * @param user - The data for the new user.
   * @returns The created user.
   */
  async create(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  /**
   * Retrieves a user by its unique ID.
   * @param id - The unique ID of the user.
   * @returns The user with the specified ID, or null if not found.
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  /**
   * Retrieves a user by their email address.
   * @param email - The email address of the user.
   * @returns The user with the specified email, or null if not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ email });
    return user;
  }

  /**
   * Retrieves a user by their email address and includes the password hash.
   * @param email - The email address of the user.
   * @returns The user with the specified email and password hash, or null if not found.
   */
  async findByEmailWithPassword(
    email: string,
  ): Promise<(User & { passwordHash: string }) | null> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.email = :email", { email })
      .getOne();
    return user;
  }

  /**
   * Retrieves a user by its unique ID and includes the password hash.
   * @param id - The unique ID of the user.
   * @returns The user with the specified ID and password hash, or null if not found.
   */
  async findByIdWithPassword(
    id: string,
  ): Promise<(User & { passwordHash: string }) | null> {
    return this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.id = :id", { id })
      .getOne();
  }

  /**
   * Retrieves all users.
   * @returns An array of users.
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  /**
   * Updates a user.
   * @param id - The ID of the user to update.
   * @param userData - The data to update.
   * @returns The updated user or null if not found.
   */
  async update(id: string, userData: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, userData);
    return this.findById(id);
  }

  /**
   * Deletes a user by its unique ID.
   * @param id - The unique ID of the user to delete.
   */
  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
