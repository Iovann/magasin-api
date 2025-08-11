import { Injectable, Inject, Logger } from "@nestjs/common";
import { IUserRepository } from "../repositories/user.repository";
import { CreateUserDto } from "../dto/create-user.dto";
import { User } from "../entities/user.entity";
import * as bcrypt from "bcrypt";
import { ErrorHandlingService } from "../../../common/response/error-handling";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";

/**
 * Service for handling user-related operations.
 */
@Injectable()
export class UsersService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @Inject(IUserRepository) private readonly userRepository: IUserRepository,
    private readonly errorHandlingService: ErrorHandlingService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log({
      message: "Attempting to create a new user",
      ...createUserDto,
    });
    const existingUser = await this.userRepository.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw this.errorHandlingService.returnErrorOnConflict(
        `[ERR_USER_CREATE_EMAIL_CONFLICT] Email ${createUserDto.email} already exists`,
        "A user with this email already exists",
      );
    }

    try {
      const passwordHash = await bcrypt.hash(createUserDto.password, 10);
      const userData = {
        email: createUserDto.email,
        passwordHash,
        role: createUserDto.role,
      };
      const user = await this.userRepository.create(userData);
      this.logger.log({ message: "User created successfully", id: user.id });
      return user;
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_CREATE_CRITICAL] Critical error: ${error.message}`,
        "Failed to create user",
      );
    }
  }

  async findAll(): Promise<User[]> {
    this.logger.log({ message: "Fetching all users" });
    try {
      const users = await this.userRepository.findAll();
      this.logger.log({ message: `Found ${users.length} users` });
      return users;
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_FIND_ALL_CRITICAL] Error finding all users: ${error.message}`,
        "An error occurred while fetching all users",
      );
    }
  }

  async findOne(id: string): Promise<User> {
    this.logger.log({ message: `Fetching user by ID: ${id}` });
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw this.errorHandlingService.returnErrorOnNotFound(
          `[ERR_USER_FIND_ONE_NOT_FOUND] User ${id} not found`,
          "User not found",
        );
      }
      this.logger.log({ message: `Found user with ID ${id}`, user });
      return user;
    } catch (error) {
      if (error.status) throw error;
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_FIND_ONE_CRITICAL] Error finding user by ID: ${error.message}`,
        "An error occurred while fetching the user by ID",
      );
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.log({ message: `Fetching user by email: ${email}` });
    try {
      const user = await this.userRepository.findByEmail(email);
      if (user) {
        this.logger.log({ message: `Found user with email ${email}` });
      } else {
        this.logger.log({ message: `User with email ${email} not found` });
      }
      return user;
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_FIND_BY_EMAIL_CRITICAL] Error finding user by email: ${error.message}`,
        "An error occurred while fetching the user by email",
      );
    }
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findByEmailWithPassword(email);
  }

  async setCurrentRefreshToken(refreshToken: string, userId: string) {
    const salt = await bcrypt.genSalt();
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
    await this.userRepository.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.refreshToken) return null;

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (isRefreshTokenMatching) {
      return user;
    }

    return null;
  }

  async removeRefreshToken(userId: string) {
    return this.userRepository.update(userId, {
      refreshToken: undefined,
    });
  }

  async remove(id: string): Promise<void> {
    this.logger.log({ message: `Attempting to remove user ${id}` });
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw this.errorHandlingService.returnErrorOnNotFound(
        `[ERR_USER_REMOVE_NOT_FOUND] User ${id} not found`,
        "User not found",
      );
    }

    try {
      await this.userRepository.delete(id);
      this.logger.log({ message: `User ${id} removed successfully` });
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_REMOVE_CRITICAL] Critical error: ${error.message}`,
        "Failed to delete user",
      );
    }
  }

  async getUserStats(): Promise<{
    total: number;
    byRole: Record<string, number>;
  }> {
    this.logger.log({ message: "Fetching user stats" });
    try {
      const users = await this.userRepository.findAll();
      const stats = {
        total: users.length,
        byRole: {} as Record<string, number>,
      };

      users.forEach((user) => {
        stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
      });

      this.logger.log({ message: "Successfully fetched user stats", stats });
      return stats;
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_STATS_CRITICAL] Error getting user stats: ${error.message}`,
        "An error occurred while getting user stats",
      );
    }
  }
}
