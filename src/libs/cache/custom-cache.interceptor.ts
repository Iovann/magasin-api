import { Injectable, ExecutionContext, CallHandler } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { CacheService } from "./cache.service";

@Injectable()
export class CustomCacheInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();

    // Générez une clé de cache unique basée sur l'URL et les paramètres
    const cacheKey = this.generateCacheKey(request);

    try {
      // Essayez de récupérer la valeur en cache
      const cachedValue = await this.cacheService.get(cacheKey);
      if (cachedValue) {
        return of(cachedValue);
      }

      // Si non en cache, exécutez la requête et mettez en cache le résultat
      return next.handle().pipe(
        tap((data) => {
          this.cacheService.set(cacheKey, data, { ttl: 3600 }).catch((err) => {
            this.cacheService["logger"].error(
              `Failed to cache response: ${err.message}`,
            );
          });
        }),
      );
    } catch (error) {
      this.cacheService["logger"].error(`Cache error: ${error.message}`);
      return next.handle();
    }
  }

  private generateCacheKey(request: any): string {
    // Personnalisez la génération de clé selon vos besoins
    return `cache:${request.method}:${request.url}`;
  }
}
