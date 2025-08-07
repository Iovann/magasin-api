import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum } from 'class-validator';
import { Role } from '../../../common/enum/role.enum';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString()
  @IsEnum(Role)
  role: Role;
}
