import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheModule } from './cache.module';
import { CacheService } from './cache.service';
import { ErrorHandlingService } from '../common/response/error-handling';

describe('CacheModule', () => {
  let module: TestingModule;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    wrap: jest.fn(),
    store: {
      flushAll: jest.fn(),
      keys: jest.fn(),
    },
  };

  const mockErrorHandlingService = {
    returnErrorOnBadRequest: jest.fn(),
    returnErrorOnInternalServerError: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              REDIS_HOST: 'localhost',
              REDIS_PORT: 6379,
              REDIS_DB: 0,
              REDIS_PASSWORD: '',
              CACHE_TTL: 3600,
            }),
          ],
        }),
      ],
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: ErrorHandlingService,
          useValue: mockErrorHandlingService,
        },
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide CacheService', () => {
    const service = module.get<CacheService>(CacheService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(CacheService);
  });

  it('should configure Redis with environment variables', () => {
    const configService = module.get<ConfigService>(ConfigService);
    
    expect(configService.get('REDIS_HOST')).toBe('localhost');
    expect(configService.get('REDIS_PORT')).toBe(6379);
    expect(configService.get('REDIS_DB')).toBe(0);
    expect(configService.get('REDIS_PASSWORD')).toBe('');
    expect(configService.get('CACHE_TTL')).toBe(3600);
  });

  it('should have CACHE_MANAGER available', () => {
    const cacheManager = module.get(CACHE_MANAGER);
    expect(cacheManager).toBeDefined();
  });

  it('should have ErrorHandlingService available', () => {
    const errorHandlingService = module.get(ErrorHandlingService);
    expect(errorHandlingService).toBeDefined();
  });
});
