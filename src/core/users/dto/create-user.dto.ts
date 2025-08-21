import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Role } from "../../../common/enum/role.enum";
import { IsPhoneNumber } from "../../../common/decorators/is-phone-number.decorator";

/**
 * Data transfer object for creating a new user.
 */
export class CreateUserDto {
  /**
   * The user's first name.
   * @example "John"
   */
  @ApiProperty({
    description: "The user's first name",
    example: "John",
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  /**
   * The user's last name.
   * @example "Doe"
   */
  @ApiProperty({
    description: "The user's last name",
    example: "Doe",
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  /**
   * The user's phone number.
   * @example "+33612345678"
   */
  @ApiProperty({
    description: "The user's phone number",
    example: "+33612345678",
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  /**
   * The unique email address of the user.
   * A temporary password will be generated and sent to this email.
   * @example "admin@gunshop.com"
   */
  @ApiProperty({
    description:
      "The unique email address of the user. A temporary password will be generated and sent to this email.",
    example: "admin@gunshop.com",
    format: "email",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

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
