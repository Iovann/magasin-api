import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Role } from "../../../common/enum/role.enum";

/**
 * Data transfer object for creating a new user.
 */
export class CreateUserDto {
  /**
   * The unique email address of the user.
   * @example "admin@gunshop.com"
   */
  @ApiProperty({
    description: "The unique email address of the user",
    example: "admin@gunshop.com",
    format: "email",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * The user's password (minimum 8 characters).
   * @example "SuperAdmin123!"
   */
  @ApiProperty({
    description: "The user's password (minimum 8 characters)",
    example: "SuperAdmin123!",
    minLength: 8,
    format: "password",
  })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  password: string;

  /**
   * The user's role in the system.
   * @example "magasinier"
   */
  @ApiProperty({
    description: "The user's role in the system",
    enum: Role,
    example: Role.Magasinier,
  })
  @IsString()
  @IsEnum(Role)
  role: Role;
}
