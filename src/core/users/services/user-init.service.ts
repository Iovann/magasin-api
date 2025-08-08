import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from '../../../common/enum/role.enum';

@Injectable()
export class UserInitService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UserInitService.name);

  constructor(private readonly usersService: UsersService) {}

  async onApplicationBootstrap() {
    await this.createDefaultSuperAdmin();
  }

  private async createDefaultSuperAdmin() {
    try {
      // Vérifier si un Super Admin existe déjà
      const users = await this.usersService.findAll();
      const superAdminExists = users.some(user => 
        user.role === Role.SuperAdmin
      );

      if (superAdminExists) {
        // this.logger.log('✅ Super Admin already exists');
        return;
      }

      // Créer le Super Admin par défaut
      const defaultAdmin = {
        email: 'admin@gunshop.com',
        password: 'SuperAdmin123!',
        role: Role.SuperAdmin
      };

      const createdAdmin = await this.usersService.create(defaultAdmin);
      
      this.logger.log(`🔐 Default Super Admin created:`);
      this.logger.log(`   Email: ${createdAdmin.email}`);
      this.logger.log(`   ID: ${createdAdmin.id}`);
      this.logger.log(`   Password: ${defaultAdmin.password}`);
      // this.logger.warn('⚠️  CHANGE THE DEFAULT PASSWORD IMMEDIATELY!');

    } catch (error) {
      this.logger.error('❌ Failed to create default Super Admin:', error.message);
    }
  }
}
