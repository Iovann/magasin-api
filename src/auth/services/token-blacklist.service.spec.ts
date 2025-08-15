import { Test, TestingModule } from '@nestjs/testing';
import { TokenBlacklistService } from './token-blacklist.service';
import { CacheService } from '../../libs/cache/cache.service';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;
  let cacheService: jest.Mocked<CacheService>;

  const mockCacheService = {
    set: jest.fn(),
    get: jest.fn(),
    has: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<TokenBlacklistService>(TokenBlacklistService);
    cacheService = module.get(CacheService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addToBlacklist', () => {
    it('should add token to blacklist successfully', async () => {
      const token = 'test-token';
      const ttl = 3600;

      mockCacheService.set.mockResolvedValue(undefined);

      await service.addToBlacklist(token, ttl);

      expect(cacheService.set).toHaveBeenCalledWith(
        'blacklist:test-token',
        true,
        { ttl: 3600 }
      );
    });

    it('should handle cache service errors', async () => {
      const token = 'test-token';
      const ttl = 3600;
      const error = new Error('Cache error');

      mockCacheService.set.mockRejectedValue(error);

      await expect(service.addToBlacklist(token, ttl)).rejects.toThrow('Cache error');
      expect(cacheService.set).toHaveBeenCalledWith(
        'blacklist:test-token',
        true,
        { ttl: 3600 }
      );
    });

    it('should handle zero TTL', async () => {
      const token = 'test-token';
      const ttl = 0;

      mockCacheService.set.mockResolvedValue(undefined);

      await service.addToBlacklist(token, ttl);

      expect(cacheService.set).toHaveBeenCalledWith(
        'blacklist:test-token',
        true,
        { ttl: undefined }
      );
    });
  });

  describe('isBlacklisted', () => {
    it('should return true when token is blacklisted', async () => {
      const token = 'test-token';

      mockCacheService.has.mockResolvedValue(true);

      const result = await service.isBlacklisted(token);

      expect(result).toBe(true);
      expect(cacheService.has).toHaveBeenCalledWith('blacklist:test-token');
    });

    it('should return false when token is not blacklisted', async () => {
      const token = 'test-token';

      mockCacheService.has.mockResolvedValue(false);

      const result = await service.isBlacklisted(token);

      expect(result).toBe(false);
      expect(cacheService.has).toHaveBeenCalledWith('blacklist:test-token');
    });

    it('should return false when cache service throws error', async () => {
      const token = 'test-token';
      const error = new Error('Cache error');

      mockCacheService.has.mockRejectedValue(error);

      const result = await service.isBlacklisted(token);

      expect(result).toBe(false);
      expect(cacheService.has).toHaveBeenCalledWith('blacklist:test-token');
    });
  });

  describe('removeFromBlacklist', () => {
    it('should remove token from blacklist successfully', async () => {
      const token = 'test-token';

      mockCacheService.delete.mockResolvedValue(undefined);

      await service.removeFromBlacklist(token);

      expect(cacheService.delete).toHaveBeenCalledWith('blacklist:test-token');
    });

    it('should handle cache service errors', async () => {
      const token = 'test-token';
      const error = new Error('Cache error');

      mockCacheService.delete.mockRejectedValue(error);

      await expect(service.removeFromBlacklist(token)).rejects.toThrow('Cache error');
      expect(cacheService.delete).toHaveBeenCalledWith('blacklist:test-token');
    });
  });

  describe('clearBlacklist', () => {
    it('should clear entire blacklist successfully', async () => {
      mockCacheService.clear.mockResolvedValue(undefined);

      await service.clearBlacklist();

      expect(cacheService.clear).toHaveBeenCalled();
    });

    it('should handle cache service errors', async () => {
      const error = new Error('Cache error');

      mockCacheService.clear.mockRejectedValue(error);

      await expect(service.clearBlacklist()).rejects.toThrow('Cache error');
      expect(cacheService.clear).toHaveBeenCalled();
    });
  });

  describe('blacklist prefix', () => {
    it('should use correct prefix for all operations', async () => {
      const token = 'test-token';
      const ttl = 3600;

      mockCacheService.set.mockResolvedValue(undefined);
      mockCacheService.has.mockResolvedValue(true);
      mockCacheService.delete.mockResolvedValue(undefined);

      await service.addToBlacklist(token, ttl);
      await service.isBlacklisted(token);
      await service.removeFromBlacklist(token);

      expect(cacheService.set).toHaveBeenCalledWith('blacklist:test-token', true, { ttl: 3600 });
      expect(cacheService.has).toHaveBeenCalledWith('blacklist:test-token');
      expect(cacheService.delete).toHaveBeenCalledWith('blacklist:test-token');
    });
  });
});
