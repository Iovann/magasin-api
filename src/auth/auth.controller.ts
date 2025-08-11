import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { User } from "../core/users/entities/user.entity";
import { LoginDto } from "./dto/login.dto";
import { ApiBearerAuth } from '@nestjs/swagger';


@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Retourne les tokens JWT',
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Email ou mot de passe incorrect' 
  })
  async login(@Request() req: { user: User }) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Log out a user" })
  @ApiResponse({ status: 200, description: "User logged out successfully." })
  async logout(@Request() req: { user: User }) {
    return this.authService.logout((req.user as User).id);
  }

  @UseGuards(JwtRefreshGuard)
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: "Rafraîchir le token d'accès",
    description: "Nécessite un refresh token valide"
  })
  @ApiResponse({ 
    status: 200, 
    description: "Nouveaux tokens générés",
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        refresh_token: { type: 'string' }
      }
    }
  })
  async refresh(@Request() req: { user: User & { refreshToken: string } }) {
    return this.authService.getTokens(req.user.id, req.user.email, req.user.role);
  }
}
