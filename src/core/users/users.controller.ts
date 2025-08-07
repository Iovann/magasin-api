import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { 
  SuperAdminOnly, 
  UserPermissions 
} from '../../common/decorators/permissions.decorator';
import { UserAction } from '../../common/enum/permission.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Créer un nouvel utilisateur
   * Seul le SuperAdmin peut créer des utilisateurs
   */
  @Post()
  @SuperAdminOnly()
  @UserPermissions([UserAction.CREATE])
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * Obtenir tous les utilisateurs
   * Seul le SuperAdmin peut voir tous les utilisateurs
   */
  @Get()
  @SuperAdminOnly()
  @UserPermissions([UserAction.VIEW])
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * Obtenir les statistiques des utilisateurs
   */
  @Get('stats')
  @SuperAdminOnly()
  @UserPermissions([UserAction.VIEW])
  getStats() {
    return this.usersService.getUserStats();
  }

  /**
   * Obtenir un utilisateur par ID
   */
  @Get(':id')
  @SuperAdminOnly()
  @UserPermissions([UserAction.VIEW])
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * Supprimer un utilisateur
   * Seul le SuperAdmin peut supprimer des utilisateurs
   */
  @Delete(':id')
  @SuperAdminOnly()
  @UserPermissions([UserAction.DELETE])
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
