import { User } from "../entities/user.entity";

/**
 * Abstract repository for user data access.
 * Defines the contract that all user repositories must follow.
 */
export abstract class IUserRepository {
  /**
   * Creates a new user.
   * @param user - The user data to create, without id and createdAt.
   * @returns The created user.
   */
  abstract create(user: Omit<User, "id" | "createdAt">): Promise<User>;

  /**
   * Finds a user by their ID.
   * @param id - The ID of the user.
   * @returns The user or null if not found.
   */
  abstract findById(id: string): Promise<User | null>;

  /**
   * Finds a user by their email address.
   * @param email - The email of the user.
   * @returns The user or null if not found.
   */
  abstract findByEmail(email: string): Promise<User | null>;

  /**
   * Finds all users.
   * @returns A list of all users.
   */
  abstract findAll(): Promise<User[]>;

  /**
   * Deletes a user by their ID.
   * @param id - The ID of the user to delete.
   */
  abstract delete(id: string): Promise<void>;
}
