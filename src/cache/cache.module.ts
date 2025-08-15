import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import Keyv from 'keyv';
import KeyvValkey from '@keyv/valkey';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const logger = new Logger('CacheModule');
        
        const store = new KeyvValkey(
          `redis://${config.get<string>('REDIS_PASSWORD') ? `:${config.get<string>('REDIS_PASSWORD')}@` : ''}${config.get<string>('REDIS_HOST', 'localhost')}:${config.get<number>('REDIS_PORT', 6379)}/${config.get<number>('REDIS_DB', 0)}`
        );
        
        store.on('error', (err: Error) => {
          logger.error(`Erreur de connexion à Valkey: ${err.message}`);
        });

        const keyv = new Keyv({
          store,
          ttl: config.get<number>('CACHE_TTL', 60) * 1000,
        });

        keyv.on('error', (err: Error) => {
          logger.error(`Erreur de connexion à Valkey: ${err.message}`); 
        });

        logger.log('Module de cache configuré avec succès');

        return {
          store: keyv,
          ttl: config.get<number>('CACHE_TTL', 60) * 1000,
          max: 1000,
          isCacheable: () => true,
        };
      },
      isGlobal: true,
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}