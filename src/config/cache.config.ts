import { Configuration, Value } from "@itgorillaz/configify";
import { IsString, IsOptional, IsNumberString, IsIn } from "class-validator";

@Configuration()
export class CacheConfig {
  @IsString()
  @Value('CACHE_HOST', { default: 'localhost' })
  host: string;

  @IsNumberString()
  @Value('CACHE_PORT', { default: '6379' })
  port: string;

  @IsNumberString()
  @Value('CACHE_TTL', { default: '3600' })
  ttl: string;

  @IsNumberString()
  @Value('CACHE_DB', { default: '0' })
  db: string;

  @IsString() @IsOptional()
  @Value('CACHE_PASSWORD')
  password?: string;

  @IsString()
  @Value('CACHE_PREFIX', { default: 'magasinx:' })
  keyPrefix: string;

  @IsNumberString()
  @Value('CACHE_MAX_ITEMS', { default: '1000' })
  maxItems: string;

  @IsNumberString()
  @Value('CACHE_MAX_RETRIES', { default: '3' })
  maxRetries: string;

  @IsIn(['true', 'false'])
  @Value('CACHE_READY_CHECK', { default: 'true' })
  readyCheck: string;
}
