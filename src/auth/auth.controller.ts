import {
  Controller,
  Post,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import type { Request } from "express";
import { User } from "../core/users/entities/user.entity";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Log in a user" })
  @ApiResponse({
    status: 200,
    description: "Returns the access and refresh tokens.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  async login(@Req() req: Request) {
    return this.authService.login(req.user as User);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Log out a user" })
  @ApiResponse({ status: 200, description: "User logged out successfully." })
  async logout(@Req() req: Request) {
    return this.authService.logout((req.user as User).id);
  }

  @UseGuards(JwtRefreshGuard)
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh the access token" })
  @ApiResponse({ status: 200, description: "Returns a new access token." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  async refresh(@Req() req: Request) {
    const user = req.user as User & { refreshToken: string };
    return this.authService.getTokens(user.id, user.email, user.role);
  }
}
