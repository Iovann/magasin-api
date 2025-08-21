import { Injectable, OnApplicationBootstrap, Logger } from "@nestjs/common";
import { UsersService } from "./users.service";
import { Role } from "../../../common/enum/role.enum";
import { InitUserConfig } from "../../../config/initUser.config";

/**
 * Service responsible for initializing a default SuperAdmin user on application startup.
 */
@Injectable()
export class UserInitService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UserInitService.name);

  constructor(private readonly usersService: UsersService, private readonly initUserConfig: InitUserConfig) {}

  /**
   * Lifecycle hook that runs once the application has fully started.
   * Triggers the creation of the default SuperAdmin.
   */
  async onApplicationBootstrap() {
    await this.createDefaultSuperAdmin();
  }

  /**
   * Checks if a SuperAdmin user already exists.
   * If not, it creates a default SuperAdmin with predefined credentials.
   * @private
   */
  private async createDefaultSuperAdmin() {
    try {
      // Check if a Super Admin already exists
      const users = await this.usersService.findAll();
      const superAdminExists = users.some(
        (user) => user.role === Role.SuperAdmin,
      );

      if (superAdminExists) {
        this.logger.log("✅ Super Admin already exists");
        return;
      }

      // Create the default Super Admin
      const defaultAdmin = {
        email: this.initUserConfig.adminEmail,
        password: this.initUserConfig.adminPassword,
        role: Role.SuperAdmin,
        firstName: this.initUserConfig.adminFirstName,
        lastName: this.initUserConfig.adminLastName,
        phoneNumber: this.initUserConfig.adminPhoneNumber,
      };

      const createdAdmin = await this.usersService.create(defaultAdmin);

      this.logger.log(`🔐 Default Super Admin created:`);
      this.logger.log(`   Email: ${createdAdmin.email}`);
      this.logger.log(`   ID: ${createdAdmin.id}`);
      this.logger.log(`   Password: ${defaultAdmin.password}`);
      this.logger.warn("⚠️  CHANGE THE DEFAULT PASSWORD IMMEDIATELY!");
    } catch (error) {
      this.logger.error(
        "❌ Failed to create default Super Admin:",
        error.message,
      );
    }
  }
}
