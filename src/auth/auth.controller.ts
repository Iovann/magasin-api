import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Body,
  Headers,
  Get,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { User } from "../core/users/entities/user.entity";
import { LoginDto } from "./dto/login.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ThrottlerGuard } from "@nestjs/throttler";
import { Throttle } from "@nestjs/throttler";

@ApiTags("auth")
@Controller("auth")
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Logs in a user and returns JWT tokens.
   * @param req The HTTP request.
   * @returns The JWT tokens.
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "User login" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: "Return JWT tokens",
  })
  @ApiResponse({
    status: 401,
    description: "Invalid email or password",
  })
  async login(@Request() req: { user: User }) {
    return this.authService.login(req.user);
  }

  /**
   * Logs out a user and revokes their access token.
   * @param req The HTTP request.
   * @param authHeader The authorization header.
   */
  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "User logout" })
  @ApiBearerAuth("JWT-auth")
  @ApiResponse({ status: 204, description: "User logged out successfully." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  async logout(
    @Request() req: { user: User },
    @Headers("authorization") authHeader: string,
  ) {
    const token = authHeader?.split(" ")[1];
    if (token) {
      await this.authService.logout(req.user.id, token);
    }
  }

  /**
   * Refreshes the JWT tokens.
   * @param req The HTTP request.
   * @returns The new JWT tokens.
   */
  @UseGuards(JwtRefreshGuard)
  @Post("refresh")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Refresh JWT tokens",
    description: "Refresh JWT tokens",
  })
  @ApiResponse({
    status: 200,
    description: "New tokens generated",
    schema: {
      type: "object",
      properties: {
        access_token: { type: "string" },
        refresh_token: { type: "string" },
      },
    },
  })
  async refresh(@Request() req: { user: User & { refreshToken: string } }) {
    return this.authService.getTokens(
      req.user.id,
      req.user.email,
      req.user.role,
    );
  }

  /**
   * Changes the user's password.
   * @param req The HTTP request.
   * @param changePasswordDto The change password DTO.
   */
  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Change user password" })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: "Password changed successfully" })
  @ApiResponse({ status: 401, description: "Invalid current password" })
  async changePassword(
    @Request() req: { user: User },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  /**
   * Tests if the token is valid (not revoked).
   * @param req The HTTP request.
   * @returns The user ID and email.
   */
  @UseGuards(JwtAuthGuard)
  @Get("test-token")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Test if token is valid (not revoked)" })
  @ApiResponse({ status: 200, description: "Token is valid" })
  @ApiResponse({ status: 401, description: "Token is revoked or invalid" })
  async testToken(@Request() req: { user: User }) {
    return {
      message: "Token is valid",
      userId: req.user.id,
      email: req.user.email,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("check-blacklist")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Check if current token is blacklisted" })
  @ApiResponse({ status: 200, description: "Blacklist status" })
  async checkBlacklist(
    @Request() req: { user: User },
    @Headers("authorization") authHeader: string,
  ) {
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return { message: "No token provided", blacklisted: false };
    }

    const isBlacklisted = await this.authService.checkTokenBlacklist(token);
    return {
      message: isBlacklisted
        ? "Token is blacklisted"
        : "Token is not blacklisted",
      blacklisted: isBlacklisted,
      userId: req.user.id,
      email: req.user.email,
    };
  }

  @Get("redis-status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Check Redis connection and blacklist status" })
  @ApiResponse({ status: 200, description: "Redis status" })
  async checkRedisStatus() {
    return await this.authService.checkRedisStatus();
  }
}
