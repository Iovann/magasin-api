import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Module, Logger, Global } from '@nestjs/common';
import { ConfigifyModule } from '@itgorillaz/configify';
import { CacheService } from './cache.service';
import Keyv from 'keyv';
import KeyvValkey from '@keyv/valkey';
import { CacheConfig } from 'src/config/cache.config';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigifyModule.forRootAsync()],
      inject: [CacheConfig],
      useFactory: async (config: CacheConfig) => {
        const logger = new Logger('CacheModule');
        
        const store = new KeyvValkey(
          `redis://${config.password ? `:${config.password}@` : ''}${config.host}:${config.port}/${config.db}`,
          {
            retryStrategy: (times: number) => {
              const delay = Math.min(times * 100, 5000);
              logger.warn(`Tentative de reconnexion à Valkey dans ${delay}ms`);
              return delay;
            }
          }
        );

        store.on('error', (err: Error) => {
          logger.error(`Erreur de connexion à Valkey: ${err.message}`);
        });
        
        store.on('connect', () => {
          logger.log('Connecté à Valkey avec succès');
        });

        const keyv = new Keyv({
          store,
          ttl: parseInt(config.ttl, 10) * 1000,
        });

        keyv.on('error', (err: Error) => {
          logger.error(`Erreur de connexion à Valkey: ${err.message}`);
        });

        logger.log('Module de cache configuré avec succès');

        return {
          store: keyv,
          ttl: parseInt(config.ttl, 10) * 1000,
          max: parseInt(config.maxItems, 10),
          isCacheable: () => true,
        };
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
