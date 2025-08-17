import { CacheModule } from "@nestjs/cache-manager";

export const TestCacheModule = CacheModule.register({
  ttl: 5, // 5 seconds for tests
  max: 10, // maximum number of items in cache
  isGlobal: true,
});
