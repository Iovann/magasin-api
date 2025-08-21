import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { Observable, from, switchMap } from "rxjs";
import { TokenBlacklistService } from "../services/token-blacklist.service";

@Injectable()
export class TokenRevocationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TokenRevocationInterceptor.name);

  constructor(private readonly tokenBlacklistService: TokenBlacklistService) {}

  /**
   * Intercepts the request to check if the token is blacklisted.
   * @param context The execution context.
   * @param next The next handler to be called.
   * @returns An Observable of the result of the next handler.
   */

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const route = `${request.method} ${request.url}`;

    this.logger.log(`[Interceptor] Checking route: ${route}`);

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      this.logger.log(
        `[Interceptor] Token found: ${token.substring(0, 20)}...`,
      );

      return from(this.checkToken(token, route)).pipe(
        switchMap(() => next.handle()),
      );
    } else {
      this.logger.log(
        `[Interceptor] No Bearer token found for route: ${route}`,
      );
      return next.handle();
    }
  }

  /**
   * Checks if the token is blacklisted.
   * @param token The JWT token to check.
   * @param route The route to check.
   * @returns A Promise that resolves to void.
   */

  private async checkToken(token: string, route: string): Promise<void> {
    try {
      const isBlacklisted =
        await this.tokenBlacklistService.isBlacklisted(token);
      this.logger.log(
        `[Interceptor] Blacklist check result: ${isBlacklisted ? "BLACKLISTED" : "VALID"}`,
      );

      if (isBlacklisted) {
        this.logger.warn(
          `[Interceptor] Revoked token detected! Blocking access for route: ${route}`,
        );
        throw new UnauthorizedException("Token has been revoked");
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        `[Interceptor] Error checking token blacklist: ${error.message}`,
      );
    }
  }
}
