import { Configuration, Value } from "@itgorillaz/configify";
import { IsNotEmpty, IsString } from "class-validator";

@Configuration()
export class CacheConfig {
  @IsNotEmpty({ message: "Cache host should not be empty" })
  @IsString({ message: "Cache host should be a string" })
  @Value("CACHE_HOST", { default: "localhost" })
  cacheHost: string;

  @IsNotEmpty({ message: "Cache port should not be empty" })
  @Value("CACHE_PORT", { default: 6379 })
  cachePort: number;

  @Value("CACHE_TTL", { default: 3600 })
  cacheTtl: number;
}