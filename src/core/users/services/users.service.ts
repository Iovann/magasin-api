import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { IUserRepository } from "../repositories/user.repository";
import { CreateUserDto } from "../dto/create-user.dto";
import { User } from "../entities/user.entity";
import * as bcrypt from "bcrypt";

/**
 * Service for handling user-related operations.
 */
@Injectable()
export class UsersService {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Creates a new user.
   * This operation is typically restricted to SuperAdmins.
   * @param createUserDto - The data to create the user.
   * @returns The created user, without the password hash.
   * @throws {ConflictException} If a user with the same email already exists.
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if the email already exists
    const existingUser = await this.userRepository.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new ConflictException(
        `A user with the email ${createUserDto.email} already exists`,
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    // Create the user
    const userData = {
      email: createUserDto.email,
      passwordHash,
      role: createUserDto.role,
    };

    return this.userRepository.create(userData);
  }

  /**
   * Finds all users.
   * @returns A list of all users.
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  /**
   * Finds a single user by their ID.
   * @param id - The ID of the user to find.
   * @returns The user.
   * @throws {NotFoundException} If the user with the given ID is not found.
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Finds a user by their email address.
   * @param email - The email of the user.
   * @returns The user or null if not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Removes a user by their ID.
   * This operation is typically restricted to SuperAdmins.
   * @param id - The ID of the user to remove.
   * @throws {NotFoundException} If the user with the given ID is not found.
   */
  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.delete(id);
  }

  /**
   * Gets statistics about users, including total count and count by role.
   * @returns An object with user statistics.
   */
  async getUserStats(): Promise<{
    total: number;
    byRole: Record<string, number>;
  }> {
    const users = await this.userRepository.findAll();
    const stats = {
      total: users.length,
      byRole: {} as Record<string, number>,
    };

    users.forEach((user) => {
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
    });

    return stats;
  }
}
