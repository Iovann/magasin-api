import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Role } from "../../../common/enum/role.enum";

/**
 * Represents a User entity for PostgreSQL.
 */
@Entity("users")
export class PostgresUser implements User {
  /**
   * The unique identifier of the user (UUID).
   */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * The user's email address (must be unique).
   */
  @Column({ unique: true })
  email: string;

  /**
   * The user's hashed password.
   */
  @Column()
  passwordHash: string;

  /**
   * The user's role.
   */
  @Column({
    type: "enum",
    enum: Role,
    default: Role.Magasinier,
  })
  role: Role;

  /**
   * The creation date of the user.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Indicates if the user account is blocked.
   * @example false
   */
  @Column({ default: false })
  isBlocked: boolean;
}
