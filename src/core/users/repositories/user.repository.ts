import { User } from "../entities/user.entity";
import { ClientSession } from "mongoose";
import { EntityManager } from "typeorm";

export type TransactionalSession = ClientSession | EntityManager;

/**
 * Abstract repository for user data access.
 * Defines the contract that all user repositories must follow.
 */
export abstract class IUserRepository {
  /**
   * Creates a new user.
   * @param user - The user data to create, without id and createdAt.
   * @param session - The transactional session (optional).
   * @returns The created user.
   */
  abstract create(
    user: Omit<User, "id" | "createdAt">,
    session?: TransactionalSession,
  ): Promise<User>;

  /**
   * Finds a user by their ID.
   * @param id - The ID of the user.
   * @param session - The transactional session (optional).
   * @returns The user or null if not found.
   */
  abstract findById(id: string, session?: TransactionalSession): Promise<User | null>;

  /**
   * Finds a user by their email address.
   * @param email - The email of the user.
   * @param session - The transactional session (optional).
   * @returns The user or null if not found.
   */
  abstract findByEmail(
    email: string,
    session?: TransactionalSession,
  ): Promise<User | null>;

  /**
   * Finds all users.
   * @param session - The transactional session (optional).
   * @returns A list of all users.
   */
  abstract findAll(session?: TransactionalSession): Promise<User[]>;

  /**
   * Deletes a user by their ID.
   * @param id - The ID of the user to delete.
   * @param session - The transactional session (optional).
   */
  abstract delete(id: string, session?: TransactionalSession): Promise<void>;
}
