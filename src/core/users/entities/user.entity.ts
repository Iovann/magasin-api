import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Role } from "../../../common/enum/role.enum";

export class User {
  @ApiProperty({
    description: "Identifiant unique de l'utilisateur",
    example: "507f1f77bcf86cd799439011",
  })
  id: string;

  @ApiProperty({
    description: "Adresse email de l'utilisateur",
    example: "admin@gunshop.com",
    format: "email",
  })
  email: string;

  @ApiPropertyOptional({
    description: "Hash du mot de passe (jamais retourné dans les réponses)",
    writeOnly: true,
  })
  passwordHash?: string;

  @ApiProperty({
    description: "Rôle de l'utilisateur",
    enum: Role,
    example: Role.Magasinier,
  })
  role: Role;

  @ApiProperty({
    description: "Date de création de l'utilisateur",
    example: "2024-01-01T00:00:00.000Z",
    type: "string",
    format: "date-time",
  })
  createdAt: Date;
}
