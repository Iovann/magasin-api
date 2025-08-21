import { Test, TestingModule } from "@nestjs/testing";
import { CacheModule } from "./cache.module";
import { CacheService } from "./cache.service";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { ConfigifyModule } from "@itgorillaz/configify";
import { CacheConfig } from "src/config/cache.config";
import Keyv from "keyv";
import KeyvValkey from "@keyv/valkey";

jest.mock("@keyv/valkey");
jest.mock("keyv");

describe("CacheModule", () => {
  let module: TestingModule;

  const mockCacheConfig = {
    host: "localhost",
    port: "6379",
    db: "0",
    password: "password",
    ttl: "3600",
    maxItems: "1000",
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CacheModule],
    })
      .overrideProvider(CacheConfig)
      .useValue(mockCacheConfig)
      .compile();
  });

  it("should be defined", () => {
    expect(module).toBeDefined();
  });

  it("should provide CacheService", () => {
    const service = module.get<CacheService>(CacheService);
    expect(service).toBeDefined();
  });

  it("should configure the cache manager", async () => {
    const cacheManager = module.get(CACHE_MANAGER);
    expect(cacheManager).toBeDefined();
    expect(KeyvValkey).toHaveBeenCalled();
    expect(Keyv).toHaveBeenCalled();
  });
});
