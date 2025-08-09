import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Role } from "../../../common/enum/role.enum";

/**
 * Represents a User.
 * This is the core User entity used throughout the application.
 */
export class User {
  /**
   * The unique identifier of the user.
   * @example "507f1f77bcf86cd799439011"
   */
  @ApiProperty({
    description: "The unique identifier of the user",
    example: "507f1f77bcf86cd799439011",
  })
  id: string;

  /**
   * The user's email address.
   * @example "admin@gunshop.com"
   */
  @ApiProperty({
    description: "The user's email address",
    example: "admin@gunshop.com",
    format: "email",
  })
  email: string;

  /**
   * The user's password hash.
   * This property is write-only and is never returned in API responses.
   */
  @ApiPropertyOptional({
    description: "The user's password hash (never returned in responses)",
    writeOnly: true,
  })
  passwordHash?: string;

  /**
   * The user's role.
   * @example "magasinier"
   */
  @ApiProperty({
    description: "The user's role",
    enum: Role,
    example: Role.Magasinier,
  })
  role: Role;

  /**
   * The user's creation date.
   * @example "2024-01-01T00:00:00.000Z"
   */
  @ApiProperty({
    description: "The user's creation date",
    example: "2024-01-01T00:00:00.000Z",
    type: "string",
    format: "date-time",
  })
  createdAt: Date;
}
