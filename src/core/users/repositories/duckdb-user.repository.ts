import { DuckDBService } from "./../../../libs/database/duckdb.service";
import { DuckDBConnection } from "@duckdb/node-api";
import { Injectable, Logger } from "@nestjs/common";
import { IUserRepository } from "./user.repository";
import { User } from "../entities/user.entity";
import { Role } from "../../../common/enum/role.enum";
import { DatabaseConfig } from "../../../config/database.config";

interface UserWithTimestamps extends User {
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class DuckDBUserRepository implements IUserRepository {
  private readonly logger = new Logger(DuckDBUserRepository.name);
  private readonly tableName = "users";
  private connection: DuckDBConnection;

  constructor(
    private readonly duckDBService: DuckDBService,
    private readonly config: DatabaseConfig,
  ) {}
  /**
   * Initializes the DuckDB connection and creates the users table if it doesn't exist.
   */
  async onModuleInit() {
    this.connection = await this.duckDBService.getConnection();
    await this.initializeDatabase();
  }

  /**
   * Initializes the DuckDB database by creating the users table if it doesn't exist.
   */
  private async initializeDatabase(): Promise<void> {
    try {
      await this.connection.run(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          phone TEXT,
          passwordHash TEXT,
          refreshToken TEXT,
          role TEXT NOT NULL,
          isBlocked BOOLEAN DEFAULT false,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      this.logger.log("DuckDB initialized successfully");
    } catch (err) {
      this.logger.error("Failed to initialize database", err);
      throw err;
    }
  }

  /**
   * Creates a new user.
   * @param user - The data for the new user.
   * @returns The created user.
   */
  async create(
    user: Omit<User, "id" | "createdAt">,
  ): Promise<UserWithTimestamps> {
    const id = crypto.randomUUID();
    const now = new Date();
    const newUser: UserWithTimestamps = {
      ...user,
      id,
      isBlocked: user.isBlocked || false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await this.connection.run(
        `INSERT INTO ${this.tableName} (id, email, firstName, lastName, phone, passwordHash, refreshToken, role, isBlocked, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newUser.id,
          newUser.email,
          newUser.firstName,
          newUser.lastName,
          newUser.phone || null,
          newUser.passwordHash || null,
          newUser.refreshToken || null,
          newUser.role,
          newUser.isBlocked,
          newUser.createdAt.toISOString(),
          newUser.updatedAt.toISOString(),
        ],
      );
      return newUser;
    } catch (err) {
      this.logger.error("Failed to create user", err);
      throw err;
    }
  }

  /**
   * Executes a query and returns all rows.
   * @param sql - The SQL query to execute.
   * @param params - The parameters for the query.
   * @returns An array of rows.
   */
  private async queryAll(sql: string, params: any[] = []): Promise<any[]> {
    const result = await this.connection.runAndReadAll(sql, params);
    return result.getRowObjectsJS();
  }

  /**
   * Retrieves a user by its unique ID.
   * @param id - The unique ID of the user.
   * @returns The user with the specified ID, or null if not found.
   */
  async findById(id: string): Promise<UserWithTimestamps | null> {
    try {
      const rows = await this.queryAll(
        `SELECT id, email, firstName, lastName, phone, role, isBlocked, refreshToken, passwordHash, createdAt, updatedAt FROM ${this.tableName} WHERE id = ?`,
        [id],
      );
      return rows[0] ? this.mapRowToUser(rows[0]) : null;
    } catch (err) {
      this.logger.error("Failed to find user by id", err);
      throw err;
    }
  }

  /**
   * Retrieves a user by their email address.
   * @param email - The email address of the user.
   * @returns The user with the specified email, or null if not found.
   */
  async findByEmail(email: string): Promise<UserWithTimestamps | null> {
    try {
      const rows = await this.queryAll(
        `SELECT id, email, firstName, lastName, phone, role, isBlocked, refreshToken, passwordHash, createdAt, updatedAt FROM ${this.tableName} WHERE email = ?`,
        [email],
      );
      return rows[0] ? this.mapRowToUser(rows[0]) : null;
    } catch (err) {
      this.logger.error("Failed to find user by email", err);
      throw err;
    }
  }

  /**
   * Retrieves a user by their email address and includes the password hash.
   * @param email - The email address of the user.
   * @returns The user with the specified email and password hash, or null if not found.
   */
  async findByEmailWithPassword(
    email: string,
  ): Promise<(UserWithTimestamps & { passwordHash: string }) | null> {
    try {
      const rows = await this.queryAll(
        `SELECT * FROM ${this.tableName} WHERE email = ?`,
        [email],
      );
      if (!rows[0]) return null;
      return {
        ...this.mapRowToUser(rows[0]),
        passwordHash: rows[0].passwordHash,
      };
    } catch (err) {
      this.logger.error("Failed to find user by email with password", err);
      throw err;
    }
  }

  /**
   * Retrieves a user by its unique ID and includes the password hash.
   * @param id - The unique ID of the user.
   * @returns The user with the specified ID and password hash, or null if not found.
   */
  async findByIdWithPassword(
    id: string,
  ): Promise<(UserWithTimestamps & { passwordHash: string }) | null> {
    try {
      const rows = await this.queryAll(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id],
      );
      if (!rows[0]) return null;
      return {
        ...this.mapRowToUser(rows[0]),
        passwordHash: rows[0].passwordHash,
      };
    } catch (err) {
      this.logger.error("Failed to find user by id with password", err);
      throw err;
    }
  }

  /**
   * Retrieves all users.
   * @returns An array of users.
   */
  async findAll(): Promise<UserWithTimestamps[]> {
    try {
      const rows = await this.queryAll(
        `SELECT id, email, firstName, lastName, phone, role, isBlocked, refreshToken, passwordHash, createdAt, updatedAt FROM ${this.tableName}`,
      );
      return rows.map((row) => this.mapRowToUser(row));
    } catch (err) {
      this.logger.error("Failed to find all users", err);
      throw err;
    }
  }

  /**
   * Updates a user by its unique ID.
   * @param id - The unique ID of the user.
   * @param userData - The data to update for the user.
   * @returns The updated user, or null if not found.
   */
  async update(
    id: string,
    userData: Partial<User>,
  ): Promise<UserWithTimestamps | null> {
    const updates: string[] = [];
    const params: any[] = [];
    if (userData.email !== undefined) {
      updates.push("email = ?");
      params.push(userData.email);
    }
    if (userData.firstName !== undefined) {
      updates.push("firstName = ?");
      params.push(userData.firstName);
    }
    if (userData.lastName !== undefined) {
      updates.push("lastName = ?");
      params.push(userData.lastName);
    }
    if (userData.phone !== undefined) {
      updates.push("phone = ?");
      params.push(userData.phone);
    }
    if (userData.role !== undefined) {
      updates.push("role = ?");
      params.push(userData.role);
    }
    if (userData.passwordHash !== undefined) {
      updates.push("passwordHash = ?");
      params.push(userData.passwordHash);
    }
    if (userData.refreshToken !== undefined) {
      updates.push("refreshToken = ?");
      params.push(userData.refreshToken);
    }
    if (userData.isBlocked !== undefined) {
      updates.push("isBlocked = ?");
      params.push(userData.isBlocked);
    }
    if (updates.length === 0) {
      return this.findById(id);
    }
    updates.push("updatedAt = ?");
    params.push(new Date().toISOString());
    params.push(id);
    try {
      await this.connection.run(
        `UPDATE ${this.tableName} SET ${updates.join(", ")} WHERE id = ?`,
        params,
      );
      return await this.findById(id);
    } catch (err) {
      this.logger.error("Failed to update user", err);
      throw err;
    }
  }

  /**
   * Deletes a user by its unique ID.
   * @param id - The unique ID of the user.
   */
  async delete(id: string): Promise<void> {
    try {
      await this.connection.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [
        id,
      ]);
    } catch (err) {
      this.logger.error("Failed to delete user", err);
      throw err;
    }
  }

  /**
   * Maps a database row to a user object.
   * @param row - The database row to map.
   * @returns The mapped user object.
   */
  private mapRowToUser(row: any): UserWithTimestamps {
    return {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone || undefined,
      role: row.role as Role,
      isBlocked: Boolean(row.isBlocked),
      refreshToken: row.refreshToken || undefined,
      passwordHash: row.passwordHash || undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
