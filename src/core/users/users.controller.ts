import { Controller, Get, Post, Body, Param, Delete } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { UsersService } from "./services/users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { User } from "./entities/user.entity";
import {
  SuperAdminOnly,
  UserPermissions,
} from "../../common/decorators/permissions.decorator";
import { UserAction } from "../../common/enum/permission.enum";

@ApiTags("users")
// @UseGuards(AuthGuard, RolesGuard)
@Controller("users")
@ApiBearerAuth("JWT-auth")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: "Créer un nouvel utilisateur",
    description:
      "Seul le SuperAdmin peut créer des utilisateurs. Nécessite une authentification JWT.",
  })
  @ApiResponse({
    status: 201,
    description: "Utilisateur créé avec succès",
    type: User,
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({
    status: 403,
    description: "Accès interdit - SuperAdmin requis",
  })
  @ApiResponse({
    status: 409,
    description: "Utilisateur avec cet email existe déjà",
  })
  @Post()
  @SuperAdminOnly()
  @UserPermissions([UserAction.CREATE])
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({
    summary: "Obtenir tous les utilisateurs",
    description:
      "Seul le SuperAdmin peut voir la liste complète des utilisateurs.",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des utilisateurs récupérée avec succès",
    type: [User],
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({
    status: 403,
    description: "Accès interdit - SuperAdmin requis",
  })
  @Get()
  @SuperAdminOnly()
  @UserPermissions([UserAction.VIEW])
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({
    summary: "Obtenir les statistiques des utilisateurs",
    description:
      "Récupère le nombre total d'utilisateurs et la répartition par rôle.",
  })
  @ApiResponse({
    status: 200,
    description: "Statistiques récupérées avec succès",
    schema: {
      type: "object",
      properties: {
        total: { type: "number", example: 5 },
        byRole: {
          type: "object",
          example: {
            "super-admin": 1,
            magasinier: 2,
            vendeur: 2,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({
    status: 403,
    description: "Accès interdit - SuperAdmin requis",
  })
  @Get("stats")
  @SuperAdminOnly()
  @UserPermissions([UserAction.VIEW])
  getStats() {
    return this.usersService.getUserStats();
  }

  @ApiOperation({
    summary: "Obtenir un utilisateur par ID",
    description: "Récupère les détails d'un utilisateur spécifique.",
  })
  @ApiParam({
    name: "id",
    description: "ID de l'utilisateur",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiResponse({
    status: 200,
    description: "Utilisateur trouvé",
    type: User,
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({
    status: 403,
    description: "Accès interdit - SuperAdmin requis",
  })
  @ApiResponse({ status: 404, description: "Utilisateur non trouvé" })
  @Get(":id")
  @SuperAdminOnly()
  @UserPermissions([UserAction.VIEW])
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({
    summary: "Supprimer un utilisateur",
    description: "Seul le SuperAdmin peut supprimer des utilisateurs.",
  })
  @ApiParam({
    name: "id",
    description: "ID de l'utilisateur à supprimer",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiResponse({ status: 200, description: "Utilisateur supprimé avec succès" })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({
    status: 403,
    description: "Accès interdit - SuperAdmin requis",
  })
  @ApiResponse({ status: 404, description: "Utilisateur non trouvé" })
  @Delete(":id")
  @SuperAdminOnly()
  @UserPermissions([UserAction.DELETE])
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
