import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import { CacheService } from './cache.service';
import { Logger } from '@nestjs/common';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6379);
        const ttl = configService.get<number>('CACHE_TTL', 3600);
        const password = configService.get<string>('REDIS_PASSWORD');
        const db = configService.get<number>('REDIS_DB', 0);

        const logger = new Logger('CacheModule');
        logger.log(`[CacheModule] Configuring Redis with Host: ${host}, Port: ${port}, DB: ${db}, TTL: ${ttl}`);

        const redisConfig: any = {
          store: redisStore,
          host,
          port,
          db,
          ttl,
          retryDelayOnFailover: 100,
          enableReadyCheck: true,
          maxRetriesPerRequest: 3,
          connectTimeout: 10000,
          commandTimeout: 5000,
          // Forcer la connexion Redis
          lazyConnect: false,
          retryStrategy: (times: number) => {
            if (times > 3) {
              throw new Error('Redis connection failed after 3 retries');
            }
            return Math.min(times * 100, 3000);
          },
          // Désactiver le fallback en mémoire
          fallback: false,
        };

        // Ajouter le mot de passe si configuré
        if (password) {
          redisConfig.password = password;
          logger.log(`[CacheModule] Redis password configured`);
        }

        logger.log(`[CacheModule] Redis configuration: ${JSON.stringify(redisConfig, null, 2)}`);

        return redisConfig;
      },
      isGlobal: true,
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}