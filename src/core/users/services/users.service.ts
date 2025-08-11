import { Injectable, Inject, Logger } from "@nestjs/common";
import { IUserRepository } from "../repositories/user.repository";
import { CreateUserDto } from "../dto/create-user.dto";
import { User } from "../entities/user.entity";
import * as bcrypt from "bcrypt";
import { ErrorHandlingService } from "../../../common/response/error-handling";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { DataSource, EntityManager } from "typeorm";
import { Connection, ClientSession } from "mongoose";
import { InjectConnection } from "@nestjs/mongoose";

type TransactionalOperation<T> = (
  repo: IUserRepository,
  session?: ClientSession | EntityManager,
) => Promise<T>;

/**
 * Service for handling user-related operations.
 */
@Injectable()
export class UsersService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @Inject(IUserRepository) private readonly userRepository: IUserRepository,
    private readonly errorHandlingService: ErrorHandlingService,
    private readonly dataSource: DataSource,
    @InjectConnection() private readonly mongooseConnection: Connection,
  ) {}

  private async withTransaction<T>(
    operation: TransactionalOperation<T>,
  ): Promise<T> {
    const repoName = this.userRepository.constructor.name;
    this.logger.log(`Starting transaction with ${repoName}`);

    if (repoName === "PostgresUserRepository") {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      this.logger.log("Postgres transaction started");
      try {
        const result = await operation(this.userRepository, queryRunner.manager);
        await queryRunner.commitTransaction();
        this.logger.log("Postgres transaction committed");
        return result;
      } catch (error) {
        this.logger.error("Rolling back Postgres transaction", { error });
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } else if (repoName === "MongoUserRepository") {
      const session = await this.mongooseConnection.startSession();
      session.startTransaction();
      this.logger.log("Mongo transaction started");
      try {
        const result = await operation(this.userRepository, session);
        await session.commitTransaction();
        this.logger.log("Mongo transaction committed");
        return result;
      } catch (error) {
        this.logger.error("Aborting Mongo transaction", { error });
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      this.logger.log(
        `Executing operation without transaction for ${repoName}`,
      );
      return operation(this.userRepository);
    }
  }

  /**
   * Creates a new user.
   * This operation is typically restricted to SuperAdmins.
   * @param createUserDto - The data to create the user.
   * @returns The created user, without the password hash.
   * @throws {ConflictException} If a user with the same email already exists.
   * @throws {InternalServerErrorException} If a critical error occurs.
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log("Attempting to create a new user", { ...createUserDto });
    return this.withTransaction(async (repo, session) => {
      const existingUser = await repo.findByEmail(createUserDto.email, session);
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
        const user = await repo.create(userData, session);
        this.logger.log("User created successfully", { id: user.id });
        return user;
      } catch (error) {
        throw this.errorHandlingService.returnErrorOnInternalServerError(
          `[ERR_USER_CREATE_CRITICAL] Critical error: ${error.message}`,
          "Failed to create user",
        );
      }
    });
  }

  /**
   * Finds all users.
   * @returns A list of all users.
   * @throws {InternalServerErrorException} If a critical error occurs.
   */
  async findAll(): Promise<User[]> {
    this.logger.log("Fetching all users");
    try {
      const users = await this.userRepository.findAll();
      this.logger.log(`Found ${users.length} users`);
      return users;
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_FIND_ALL_CRITICAL] Error finding all users: ${error.message}`,
        "An error occurred while fetching all users",
      );
    }
  }

  /**
   * Finds a single user by their ID.
   * @param id - The ID of the user to find.
   * @returns The user.
   * @throws {NotFoundException} If the user with the given ID is not found.
   * @throws {InternalServerErrorException} If a critical error occurs.
   */
  async findOne(id: string): Promise<User> {
    this.logger.log(`Fetching user by ID: ${id}`);
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw this.errorHandlingService.returnErrorOnNotFound(
          `[ERR_USER_FIND_ONE_NOT_FOUND] User ${id} not found`,
          "User not found",
        );
      }
      this.logger.log(`Found user with ID ${id}`, { user });
      return user;
    } catch (error) {
      // Re-throw known exceptions, handle others
      if (error.status) throw error;
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_FIND_ONE_CRITICAL] Error finding user by ID: ${error.message}`,
        "An error occurred while fetching the user by ID",
      );
    }
  }

  /**
   * Finds a user by their email address.
   * @param email - The email of the user.
   * @returns The user or null if not found.
   * @throws {InternalServerErrorException} If a critical error occurs.
   */
  async findByEmail(email: string): Promise<User | null> {
    this.logger.log(`Fetching user by email: ${email}`);
    try {
      const user = await this.userRepository.findByEmail(email);
      if (user) {
        this.logger.log(`Found user with email ${email}`);
      } else {
        this.logger.log(`User with email ${email} not found`);
      }
      return user;
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_FIND_BY_EMAIL_CRITICAL] Error finding user by email: ${error.message}`,
        "An error occurred while fetching the user by email",
      );
    }
  }

  /**
   * Removes a user by their ID.
   * This operation is typically restricted to SuperAdmins.
   * @param id - The ID of the user to remove.
   * @throws {NotFoundException} If the user with the given ID is not found.
   * @throws {InternalServerErrorException} If a critical error occurs.
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Attempting to remove user ${id}`);
    return this.withTransaction(async (repo, session) => {
      const user = await repo.findById(id, session);
      if (!user) {
        throw this.errorHandlingService.returnErrorOnNotFound(
          `[ERR_USER_REMOVE_NOT_FOUND] User ${id} not found`,
          "User not found",
        );
      }

      try {
        await repo.delete(id, session);
        this.logger.log(`User ${id} removed successfully`);
      } catch (error) {
        throw this.errorHandlingService.returnErrorOnInternalServerError(
          `[ERR_USER_REMOVE_CRITICAL] Critical error: ${error.message}`,
          "Failed to delete user",
        );
      }
    });
  }

  /**
   * Gets statistics about users, including total count and count by role.
   * @returns An object with user statistics.
   * @throws {InternalServerErrorException} If a critical error occurs.
   */
  async getUserStats(): Promise<{
    total: number;
    byRole: Record<string, number>;
  }> {
    this.logger.log("Fetching user stats");
    try {
      const users = await this.userRepository.findAll();
      const stats = {
        total: users.length,
        byRole: {} as Record<string, number>,
      };

      users.forEach((user) => {
        stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
      });

      this.logger.log("Successfully fetched user stats", { stats });
      return stats;
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_USER_STATS_CRITICAL] Error getting user stats: ${error.message}`,
        "An error occurred while getting user stats",
      );
    }
  }
}
