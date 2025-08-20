import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Exclude } from "class-transformer";
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

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phone?: string;

  /**
   * The user's hashed password.
   */
  @Column({ select: false })
  @Exclude()
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

  /**
   * Stores the hashed refresh token for the user.
   */
  @Column({ nullable: true, select: false })
  @Exclude()
  refreshToken?: string;
}
