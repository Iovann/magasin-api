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
        isBlocked: false,
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
    this.logger.log({
      message: `Fetching user by email with password: ${email}`,
    });
    try {
      const user = await this.userRepository.findByEmailWithPassword(email);
      if (user) {
        this.logger.log({ message: `Found user with email ${email}` });
      } else {
        this.logger.log({ message: `User with email ${email} not found` });
      }
      return user;
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_FIND_BY_EMAIL_WITH_PASSWORD_CRITICAL] Error finding user by email with password: ${error.message}`,
        "An error occurred while fetching the user by email with password",
      );
    }
  }

  async findByIdWithPassword(
    id: string,
  ): Promise<(User & { passwordHash: string }) | null> {
    this.logger.log({ message: `Fetching user by ID with password: ${id}` });
    try {
      const user = await this.userRepository.findByIdWithPassword(id);
      if (user) {
        this.logger.log({ message: `Found user with ID ${id}` });
      } else {
        this.logger.log({ message: `User with ID ${id} not found` });
      }
      return user;
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_FIND_BY_ID_WITH_PASSWORD_CRITICAL] Error finding user by ID with password: ${error.message}`,
        "An error occurred while fetching the user by ID with password",
      );
    }
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    this.logger.log({ message: `Attempting to update user ${id}`, updateData });
    try {
      const user = await this.userRepository.update(id, updateData);
      if (!user) {
        throw this.errorHandlingService.returnErrorOnNotFound(
          `[ERR_USER_UPDATE_NOT_FOUND] User ${id} not found`,
          "User not found",
        );
      }
      this.logger.log({ message: `User ${id} updated successfully` });
      return user;
    } catch (error) {
      if (error.status) throw error;
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_UPDATE_CRITICAL] Error updating user: ${error.message}`,
        "An error occurred while updating the user",
      );
    }
  }

  async setCurrentRefreshToken(
    refreshToken: string,
    userId: string,
  ): Promise<User> {
    this.logger.log({ message: `Setting refresh token for user ${userId}` });
    try {
      const salt = await bcrypt.genSalt();
      const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
      const updatedUser = await this.userRepository.update(userId, {
        refreshToken: hashedRefreshToken,
      });

      if (!updatedUser) {
        throw this.errorHandlingService.returnErrorOnNotFound(
          `[ERR_USER_SET_REFRESH_TOKEN_NOT_FOUND] User ${userId} not found`,
          "User not found",
        );
      }

      this.logger.log({
        message: `Refresh token set for user ${userId}`,
      });
      return updatedUser;
    } catch (error) {
      if (error.status) throw error;
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_SET_REFRESH_TOKEN_CRITICAL] Error setting refresh token: ${error.message}`,
        "An error occurred while setting the refresh token",
      );
    }
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user || user.refreshToken === null || user.refreshToken === undefined) {
      return null;
    }

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (isRefreshTokenMatching) {
      return user;
    }

    return null;
  }

  async removeRefreshToken(userId: string): Promise<User> {
    this.logger.log({ message: `Removing refresh token for user ${userId}` });
    try {
      const updatedUser = await this.userRepository.update(userId, {
        refreshToken: '',
      });

      if (!updatedUser) {
        throw this.errorHandlingService.returnErrorOnNotFound(
          `[ERR_USER_REMOVE_REFRESH_TOKEN_NOT_FOUND] User ${userId} not found`,
          "User not found",
        );
      }

      this.logger.log({
        message: `Refresh token removed for user ${userId}`,
      });
      return updatedUser;
    } catch (error) {
      if (error.status) throw error;
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_REMOVE_REFRESH_TOKEN_CRITICAL] Error removing refresh token: ${error.message}`,
        "An error occurred while removing the refresh token",
      );
    }
  }

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<User> {
    this.logger.log({
      message: `Attempting to update password hash for user ${userId}`,
    });
    try {
      const updatedUser = await this.userRepository.update(userId, {
        passwordHash,
      });
      if (!updatedUser) {
        throw this.errorHandlingService.returnErrorOnNotFound(
          `[ERR_USER_UPDATE_PASSWORD_HASH_NOT_FOUND] User ${userId} not found`,
          "User not found",
        );
      }
      this.logger.log({ message: `Password hash updated for user ${userId}` });
      return updatedUser;
    } catch (error) {
      if (error.status) throw error;
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_UPDATE_PASSWORD_HASH_CRITICAL] Error updating password hash: ${error.message}`,
        "An error occurred while updating the password hash",
      );
    }
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
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    userRoles: Record<string, number>;
  }> {
    this.logger.log({ message: "Fetching user stats" });
    try {
      const users = await this.userRepository.findAll();
      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter((user) => !user.isBlocked).length,
        blockedUsers: users.filter((user) => user.isBlocked).length,
        userRoles: {} as Record<string, number>,
      };

      users.forEach((user) => {
        stats.userRoles[user.role] = (stats.userRoles[user.role] || 0) + 1;
      });

      this.logger.log({ message: "Successfully fetched user stats", stats });
      return stats;
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_GET_STATS_CRITICAL] Error getting user statistics: ${error.message}`,
        "An error occurred while fetching user statistics",
      );
    }
  }

  async blockUser(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw this.errorHandlingService.returnErrorOnNotFound(
        `[ERR_USER_BLOCK_NOT_FOUND] User ${id} not found`,
        "User not found",
      );
    }

    if (user.isBlocked) {
      throw this.errorHandlingService.returnErrorOnConflict(
        `[ERR_USER_BLOCK_CONFLICT] User ${id} is already blocked`,
        "User is already blocked",
      );
    }
    user.isBlocked = true;

    try {
      await this.userRepository.update(id, { isBlocked: true });
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_BLOCK_CRITICAL] Critical error: ${error.message}`,
        "Failed to block user",
      );
    }

    const updatedUser = await this.userRepository.findById(id);

    if (!updatedUser) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_BLOCK_CRITICAL] Failed to retrieve updated user ${id}`,
        "Failed to block user",
      );
    }
    this.logger.log({ message: `User ${id} blocked successfully` });
    return updatedUser;
  }

  async unblockUser(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw this.errorHandlingService.returnErrorOnNotFound(
        `[ERR_USER_UNBLOCK_NOT_FOUND] User ${id} not found`,
        "User not found",
      );
    }

    if (!user.isBlocked) {
      throw this.errorHandlingService.returnErrorOnConflict(
        `[ERR_USER_UNBLOCK_CONFLICT] User ${id} is not blocked`,
        "User is not blocked",
      );
    }
    user.isBlocked = false;

    try {
      await this.userRepository.update(id, { isBlocked: false });
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_UNBLOCK_CRITICAL] Critical error: ${error.message}`,
        "Failed to unblock user",
      );
    }

    const updatedUser = await this.userRepository.findById(id);

    if (!updatedUser) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_UNBLOCK_CRITICAL] Failed to retrieve updated user ${id}`,
        "Failed to unblock user",
      );
    }
    this.logger.log({ message: `User ${id} unblocked successfully` });
    return updatedUser;
  }
}
