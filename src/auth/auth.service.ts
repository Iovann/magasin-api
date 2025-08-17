import { Injectable } from "@nestjs/common";
import { UsersService } from "../core/users/services/users.service";
import { JwtService } from "@nestjs/jwt";
import { User } from "../core/users/entities/user.entity";
import { ConfigService } from "@nestjs/config";
import { ErrorHandlingService } from "../common/response/error-handling";
import { TokenBlacklistService } from "./services/token-blacklist.service";
import { BcryptService } from "../utils/bcrypt/bcrypt.service"; // Added import

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly errorHandlingService: ErrorHandlingService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly bcryptService: BcryptService, // Injected
  ) {}

  /**
   * Validates a user's credentials.
   * @param email - The user's email.
   * @param pass - The user's password.
   * @returns The user object without the password hash if validation is successful.
   * @throws UnauthorizedException if validation fails.
   */
  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, "passwordHash">> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (user && user.isBlocked) {
      throw this.errorHandlingService.returnOnAuthorized(
        "ERR_AUTH_SERVICE_002_VALIDATE_USER",
        "Your account has been blocked.",
      );
    }
    if (user && (await this.bcryptService.comparePassword(pass, user.passwordHash!))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    throw this.errorHandlingService.returnOnAuthorized(
      "ERR_AUTH_SERVICE_001_VALIDATE_USER",
      "Invalid credentials",
    );
  }

  /**
   * Logs in a user and returns access and refresh tokens.
   * @param user - The user object.
   * @returns An object containing the access and refresh tokens.
   */
  async login(user: User) {
    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.usersService.setCurrentRefreshToken(
      tokens.refreshToken,
      user.id,
    );
    return tokens;
  }

  /**
   * Logs out a user by blacklisting their access token and removing their refresh token.
   * @param userId - The ID of the user to log out.
   * @param accessToken - The access token to blacklist.
   */
  async logout(userId: string, accessToken: string): Promise<void> {
    let blacklistSuccess = false;
    
    try {
      const decodedToken = this.jwtService.decode(accessToken) as { exp: number };
      if (decodedToken && decodedToken.exp) {
        const expirationTimestamp = decodedToken.exp;
        const now = Math.floor(Date.now() / 1000);
        const ttl = expirationTimestamp - now;

        if (ttl > 0) {
          await this.tokenBlacklistService.addToBlacklist(accessToken, ttl);
          blacklistSuccess = true;
          // console.log(`[AuthService] Token successfully blacklisted for user ${userId} with TTL: ${ttl}s`);
        } else {
          console.log(`[AuthService] Token already expired for user ${userId}, skipping blacklist`);
        }
      }
    } catch (error) {
      console.error(`[AuthService] Error blacklisting token for user ${userId}:`, error);
    }

    try {
      // Toujours supprimer le refresh token de la base de données
      await this.usersService.removeRefreshToken(userId);
      console.log(`[AuthService] Refresh token removed for user ${userId}`);
    } catch (error) {
      console.error(`[AuthService] Error removing refresh token for user ${userId}:`, error);
      // Si on ne peut pas supprimer le refresh token, c'est plus critique
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        "ERR_AUTH_SERVICE_006_LOGOUT",
        "Failed to complete logout process",
      );
    }

    if (!blacklistSuccess) {
      console.warn(`[AuthService] Warning: Token blacklisting failed for user ${userId}, but logout completed`);
    }
  }

  /**
   * Generates new access and refresh tokens for a user.
   * @param userId - The user's ID.
   * @param email - The user's email.
   * @param role - The user's role.
   * @returns An object containing the new access and refresh tokens.
   */
  async getTokens(userId: string, email: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
        },
        {
          secret: this.configService.get<string>("JWT_SECRET"),
          expiresIn: this.configService.get<string>("JWT_EXPIRATION_TIME"),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
        },
        {
          secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
          expiresIn: this.configService.get<string>(
            "JWT_REFRESH_EXPIRATION_TIME",
          ),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Changes a user's password.
   * @param userId - The user's ID.
   * @param currentPassword - The user's current password.
   * @param newPassword - The new password.
   * @throws NotFoundException if the user is not found.
   * @throws UnauthorizedException if the current password is invalid.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByIdWithPassword(userId);

    if (!user) {
      throw this.errorHandlingService.returnErrorOnNotFound(
        "ERR_AUTH_SERVICE_003_CHANGE_PASSWORD",
        "User not found.",
      );
    }

    const isPasswordValid = await this.bcryptService.comparePassword(
      currentPassword,
      user!.passwordHash!,
    );
    if (!isPasswordValid) {
      throw this.errorHandlingService.returnOnAuthorized(
        "ERR_AUTH_SERVICE_004_CHANGE_PASSWORD",
        "Invalid current password.",
      );
    }

    const hashedNewPassword = await this.bcryptService.hashPassword(newPassword);
    try {
      await this.usersService.updatePasswordHash(userId, hashedNewPassword);
      return { message: "Password changed successfully." };
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        "ERR_AUTH_SERVICE_005_UPDATE_PASSWORD",
        `Error updating password, ${error}`,
      );
    }
  }

  /**
   * Check if a token is blacklisted.
   * @param token - The JWT token to check.
   * @returns True if the token is blacklisted, false otherwise.
   */
  async checkTokenBlacklist(token: string): Promise<boolean> {
    return this.tokenBlacklistService.isBlacklisted(token);
  }

  /**
   * Check Redis connection and blacklist status.
   * @returns Redis connection status and blacklist information.
   */
  async checkRedisStatus(): Promise<any> {
    try {
      // Test de connexion Redis
      const testKey = 'redis-test-connection';
      const testValue = 'test-value-' + Date.now();
      
      // Test SET
      await this.tokenBlacklistService['cacheService'].set(testKey, testValue, { ttl: 60 });
      
      // Test GET
      const retrievedValue = await this.tokenBlacklistService['cacheService'].get(testKey);
      
      // Test HAS
      const hasKey = await this.tokenBlacklistService['cacheService'].has(testKey);
      
      // Nettoyer le test
      await this.tokenBlacklistService['cacheService'].delete(testKey);
      
      return {
        status: 'connected',
        tests: {
          set: retrievedValue === testValue,
          get: retrievedValue === testValue,
          has: hasKey,
          delete: true
        },
        message: 'Redis connection is working properly'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        message: 'Redis connection failed'
      };
    }
  }
}
