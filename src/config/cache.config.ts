import { Configuration, Value } from "@itgorillaz/configify";
import { IsString, IsNumber, IsOptional, Min, Max, IsBoolean } from "class-validator";

@Configuration()
export class CacheConfig {
  @IsString()
  @Value('CACHE_HOST', { default: 'localhost' })
  host: string;

  @IsNumber()
  @Min(1) @Max(65535)
  @Value('CACHE_PORT', { default: 6379 })
  port: number;

  @IsNumber() @Min(0)
  @Value('CACHE_TTL', { default: 3600 })
  ttl: number;

  @IsNumber() @Min(0)
  @Value('CACHE_DB', { default: 0 })
  db: number;

  @IsString() @IsOptional()
  @Value('CACHE_PASSWORD')
  password?: string;

  @IsString()
  @Value('CACHE_PREFIX', { default: 'magasinx:' })
  keyPrefix: string;

  @IsNumber() @Min(1)
  @Value('CACHE_MAX_ITEMS', { default: 1000 })
  maxItems: number;

  @IsNumber() @Min(0)
  @Value('CACHE_MAX_RETRIES', { default: 3 })
  maxRetries: number;

  @IsBoolean()
  @Value('CACHE_READY_CHECK', { default: true })
  readyCheck: boolean;
}