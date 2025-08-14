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
    const route = `${request.method} ${request.url}`;

    this.logger.log(`[Interceptor] Checking route: ${route}`);

    // Seulement vérifier si un token Bearer est présent
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      this.logger.log(`[Interceptor] Token found: ${token.substring(0, 20)}...`);
      
      try {
        const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
        this.logger.log(`[Interceptor] Blacklist check result: ${isBlacklisted ? 'BLACKLISTED' : 'VALID'}`);
        
        if (isBlacklisted) {
          this.logger.warn(`[Interceptor] Revoked token detected! Blocking access for route: ${route}`);
          throw new UnauthorizedException('Token has been revoked');
        }
      } catch (error) {
        // Si c'est déjà une UnauthorizedException, la relancer
        if (error instanceof UnauthorizedException) {
          throw error;
        }
        // Pour les autres erreurs (cache, etc.), log et continuer
        this.logger.error(`[Interceptor] Error checking token blacklist: ${error.message}`);
        // On continue l'exécution même en cas d'erreur de cache
      }
    } else {
      this.logger.log(`[Interceptor] No Bearer token found for route: ${route}`);
    }

    return next.handle();
  }
}

