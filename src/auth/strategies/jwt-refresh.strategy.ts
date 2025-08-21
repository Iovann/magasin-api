import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from "passport-jwt";
import { Request } from "express";
import { UsersService } from "../../core/users/services/users.service";
import { ConfigService } from "@nestjs/config";
import { ErrorHandlingService } from "../../common/response/error-handling";

/**
 * Strategy for validating JWT refresh tokens.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  "jwt-refresh",
) {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly errorHandlingService: ErrorHandlingService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_REFRESH_SECRET")!,
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  /**
   * Validates the JWT refresh token.
   * @param req The HTTP request.
   * @param payload The JWT payload.
   * @returns The user object if the token is valid.
   */
  async validate(req: Request, payload: any) {
    const authHeader = req.get("authorization");
    if (!authHeader) {
      throw this.errorHandlingService.returnOnAuthorized(
        "ERR_REFRESH_STRATEGY_001_VALIDATE",
        "Authorization header missing",
      );
    }
    const refreshToken = authHeader.replace("Bearer", "").trim();
    const user = await this.usersService.getUserIfRefreshTokenMatches(
      refreshToken,
      payload.sub,
    );
    if (!user) {
      throw this.errorHandlingService.returnOnAuthorized(
        "ERR_REFRESH_STRATEGY_002_VALIDATE",
        "Invalid refresh token",
      );
    }
    return user;
  }
}
