import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TokenBlacklistService } from '../services/token-blacklist.service';

@Injectable()
export class TokenRevocationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TokenRevocationInterceptor.name);

  constructor(private readonly tokenBlacklistService: TokenBlacklistService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    this.logger.log(`[Interceptor] Checking request for token revocation.`);

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      this.logger.log(`[Interceptor] Token found: ${token.substring(0, 10)}...`);
      
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
      this.logger.log(`[Interceptor] Is token blacklisted? ${isBlacklisted}`);

      if (isBlacklisted) {
        this.logger.warn(`[Interceptor] Revoked token detected! Blocking access.`);
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    return next.handle();
  }
}
