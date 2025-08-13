import { Injectable } from "@nestjs/common";
import { UsersService } from "../core/users/services/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "../core/users/entities/user.entity";
import { ConfigService } from "@nestjs/config";
import { ErrorHandlingService } from "../common/response/error-handling";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly errorHandlingService: ErrorHandlingService,
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
    if (user && (await bcrypt.compare(pass, user.passwordHash!))) {
      const userWithoutPassword = Object.fromEntries(
        Object.entries(user).filter(([key]) => key !== "passwordHash"),
      ) as Omit<User, "passwordHash">;
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
   * Logs out a user by removing their refresh token.
   * @param userId - The ID of the user to log out.
   * @returns The result of the removeRefreshToken operation.
   */
  async logout(userId: string) {
    return this.usersService.removeRefreshToken(userId);
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

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user!.passwordHash!,
    );
    if (!isPasswordValid) {
      throw this.errorHandlingService.returnOnAuthorized(
        "ERR_AUTH_SERVICE_004_CHANGE_PASSWORD",
        "Invalid current password.",
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
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
}
