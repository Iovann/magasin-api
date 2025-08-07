import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/enum/role.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'Adresse email unique de l\'utilisateur',
    example: 'admin@gunshop.com',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Mot de passe de l\'utilisateur (minimum 8 caractères)',
    example: 'SuperAdmin123!',
    minLength: 8,
    format: 'password',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    description: 'Rôle de l\'utilisateur dans le système',
    enum: Role,
    example: Role.Magasinier,
  })
  @IsString()
  @IsEnum(Role)
  role: Role;
}
