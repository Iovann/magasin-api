import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../../core/users/services/users.service";
import { ErrorHandlingService } from "../../common/response/error-handling";
import { TokenBlacklistService } from "../services/token-blacklist.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly errorHandlingService: ErrorHandlingService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET")!,
      passReqToCallback: true, // Pass the request to passport callback
    });
  }

  /**
   * Validates the JWT token.
   * @param request The HTTP request.
   * @param payload The JWT payload.
   * @returns The user object if the token is valid.
   */
  async validate(request: any, payload: any) {
    const route = `${request.method} ${request.url}`;
    this.logger.log(`[JwtStrategy] Validating token for route: ${route}`);

    // Récupérer le token depuis la requête
    const authHeader = request.headers?.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (token) {
      this.logger.log(
        `[JwtStrategy] Token found: ${token.substring(0, 20)}...`,
      );
      // Vérifier si le token est dans la blacklist
      const isBlacklisted =
        await this.tokenBlacklistService.isBlacklisted(token);
      this.logger.log(
        `[JwtStrategy] Blacklist check result: ${isBlacklisted ? "BLACKLISTED" : "VALID"}`,
      );

      if (isBlacklisted) {
        this.logger.warn(
          `[JwtStrategy] Revoked token detected! Blocking access for route: ${route}`,
        );
        throw this.errorHandlingService.returnOnAuthorized(
          "ERR_JWT_STRATEGY_002_TOKEN_REVOKED",
          "Token has been revoked",
        );
      }
    } else {
      this.logger.warn(
        `[JwtStrategy] No token found in request for route: ${route}`,
      );
    }

    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      this.logger.error(
        `[JwtStrategy] User not found for payload.sub: ${payload.sub}`,
      );
      throw this.errorHandlingService.returnOnAuthorized(
        "ERR_JWT_STRATEGY_001_VALIDATE",
        "Invalid token",
      );
    }

    this.logger.log(
      `[JwtStrategy] Token validation successful for user: ${user.email}`,
    );
    return user;
  }
}
