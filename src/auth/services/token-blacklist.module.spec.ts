import { Test, TestingModule } from "@nestjs/testing";
import { TokenBlacklistService } from "./token-blacklist.service";
import { CacheService } from "../../libs/cache/cache.service";

describe("TokenBlacklistModule", () => {
  let module: TestingModule;

  const mockCacheService = {
    set: jest.fn(),
    get: jest.fn(),
    has: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();
  });

  afterEach(() => {
    module.close();
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(module).toBeDefined();
  });

  it("should provide TokenBlacklistService", () => {
    const service = module.get<TokenBlacklistService>(TokenBlacklistService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(TokenBlacklistService);
  });

  it("should have CacheService available", () => {
    const cacheService = module.get(CacheService);
    expect(cacheService).toBeDefined();
  });

  it("should be able to use TokenBlacklistService", async () => {
    const service = module.get<TokenBlacklistService>(TokenBlacklistService);
    const token = "test-token";
    const ttl = 3600;

    mockCacheService.set.mockResolvedValue(undefined);
    mockCacheService.has.mockResolvedValue(true);

    await service.addToBlacklist(token, ttl);
    const isBlacklisted = await service.isBlacklisted(token);

    expect(isBlacklisted).toBe(true);
    expect(mockCacheService.set).toHaveBeenCalled();
    expect(mockCacheService.has).toHaveBeenCalled();
  });
});
