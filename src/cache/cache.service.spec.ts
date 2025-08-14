import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import { ErrorHandlingService } from '../common/response/error-handling';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: any;
  let errorHandlingService: jest.Mocked<ErrorHandlingService>;

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
    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get(CACHE_MANAGER);
    errorHandlingService = module.get(ErrorHandlingService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should get value from cache successfully', async () => {
      const key = 'test-key';
      const expectedValue = 'test-value';

      mockCacheManager.get.mockResolvedValue(expectedValue);

      const result = await service.get(key);

      expect(result).toBe(expectedValue);
      expect(cacheManager.get).toHaveBeenCalledWith(key);
    });

    it('should handle cache errors', async () => {
      const key = 'test-key';
      const error = new Error('Cache error');

      mockCacheManager.get.mockRejectedValue(error);
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(() => {
        throw new Error('Internal server error');
      });

      await expect(service.get(key)).rejects.toThrow('Internal server error');
      expect(errorHandlingService.returnErrorOnInternalServerError).toHaveBeenCalled();
    });

    it('should validate key', async () => {
      mockErrorHandlingService.returnErrorOnBadRequest.mockImplementation(() => {
        throw new Error('Bad request');
      });

      await expect(service.get('')).rejects.toThrow('Bad request');
      await expect(service.get(null as any)).rejects.toThrow('Bad request');
      await expect(service.get(undefined as any)).rejects.toThrow('Bad request');
    });
  });

  describe('set', () => {
    it('should set value in cache successfully', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 3600;

      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value, { ttl });

      expect(cacheManager.set).toHaveBeenCalledWith(key, value, { ttl });
    });

    it('should handle cache errors', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 3600;
      const error = new Error('Cache error');

      mockCacheManager.set.mockRejectedValue(error);
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(() => {
        throw new Error('Internal server error');
      });

      await expect(service.set(key, value, { ttl })).rejects.toThrow('Internal server error');
      expect(errorHandlingService.returnErrorOnInternalServerError).toHaveBeenCalled();
    });

    it('should validate TTL', async () => {
      const key = 'test-key';
      const value = 'test-value';

      mockErrorHandlingService.returnErrorOnBadRequest.mockImplementation(() => {
        throw new Error('Bad request');
      });

      await expect(service.set(key, value, { ttl: -1 })).rejects.toThrow('Bad request');
      await expect(service.set(key, value, { ttl: NaN })).rejects.toThrow('Bad request');
    });
  });

  describe('delete', () => {
    it('should delete value from cache successfully', async () => {
      const key = 'test-key';

      mockCacheManager.del.mockResolvedValue(undefined);

      await service.delete(key);

      expect(cacheManager.del).toHaveBeenCalledWith(key);
    });

    it('should handle cache errors', async () => {
      const key = 'test-key';
      const error = new Error('Cache error');

      mockCacheManager.del.mockRejectedValue(error);
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(() => {
        throw new Error('Internal server error');
      });

      await expect(service.delete(key)).rejects.toThrow('Internal server error');
      expect(errorHandlingService.returnErrorOnInternalServerError).toHaveBeenCalled();
    });
  });

  describe('has', () => {
    it('should return true when key exists', async () => {
      const key = 'test-key';

      mockCacheManager.get.mockResolvedValue('value');

      const result = await service.has(key);

      expect(result).toBe(true);
      expect(cacheManager.get).toHaveBeenCalledWith(key);
    });

    it('should return false when key does not exist', async () => {
      const key = 'test-key';

      mockCacheManager.get.mockResolvedValue(undefined);

      const result = await service.has(key);

      expect(result).toBe(false);
      expect(cacheManager.get).toHaveBeenCalledWith(key);
    });

    it('should return false when key is null', async () => {
      const key = 'test-key';

      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.has(key);

      expect(result).toBe(false);
      expect(cacheManager.get).toHaveBeenCalledWith(key);
    });
  });

  describe('clear', () => {
    it('should clear cache using flushAll', async () => {
      mockCacheManager.store.flushAll.mockResolvedValue(undefined);

      await service.clear();

      expect(cacheManager.store.flushAll).toHaveBeenCalled();
    });

    it('should handle clear errors', async () => {
      const error = new Error('Clear error');

      // Reset mocks for this test
      jest.clearAllMocks();
      mockCacheManager.store.flushAll.mockRejectedValue(error);
      mockCacheManager.store.keys.mockRejectedValue(error);
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(() => {
        throw new Error('Internal server error');
      });

      await expect(service.clear()).rejects.toThrow('Internal server error');
      expect(errorHandlingService.returnErrorOnInternalServerError).toHaveBeenCalled();
    });
  });

  describe('wrap', () => {
    it('should wrap function with cache', async () => {
      const key = 'test-key';
      const fn = jest.fn().mockResolvedValue('result');
      const ttl = 3600;

      mockCacheManager.wrap.mockResolvedValue('result');

      const result = await service.wrap(key, fn, { ttl });

      expect(result).toBe('result');
      expect(cacheManager.wrap).toHaveBeenCalledWith(key, fn, { ttl });
    });

    it('should handle wrap errors', async () => {
      const key = 'test-key';
      const fn = jest.fn();
      const ttl = 3600;
      const error = new Error('Wrap error');

      mockCacheManager.wrap.mockRejectedValue(error);
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(() => {
        throw new Error('Internal server error');
      });

      await expect(service.wrap(key, fn, { ttl })).rejects.toThrow('Internal server error');
      expect(errorHandlingService.returnErrorOnInternalServerError).toHaveBeenCalled();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value when exists', async () => {
      const key = 'test-key';
      const fn = jest.fn();
      const ttl = 3600;
      const cachedValue = 'cached-value';

      mockCacheManager.get.mockResolvedValue(cachedValue);

      const result = await service.getOrSet(key, fn, { ttl });

      expect(result).toBe(cachedValue);
      expect(cacheManager.get).toHaveBeenCalledWith(key);
      expect(fn).not.toHaveBeenCalled();
    });

    it('should execute function and cache result when not cached', async () => {
      const key = 'test-key';
      const fn = jest.fn().mockResolvedValue('new-value');
      const ttl = 3600;

      mockCacheManager.get.mockResolvedValue(undefined);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.getOrSet(key, fn, { ttl });

      expect(result).toBe('new-value');
      expect(cacheManager.get).toHaveBeenCalledWith(key);
      expect(fn).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(key, 'new-value', { ttl });
    });
  });

  describe('keys', () => {
    it('should return keys from cache store', async () => {
      const pattern = 'test:*';
      const expectedKeys = ['test:1', 'test:2'];

      mockCacheManager.store.keys.mockResolvedValue(expectedKeys);

      const result = await service.keys(pattern);

      expect(result).toEqual(expectedKeys);
      expect(cacheManager.store.keys).toHaveBeenCalledWith(pattern);
    });

    
    it('should handle keys errors', async () => {
      const pattern = 'test:*';
      const error = new Error('Keys error');

      mockCacheManager.store.keys.mockRejectedValue(error);
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(() => {
        throw new Error('Internal server error');
      });

      await expect(service.keys(pattern)).rejects.toThrow('Internal server error');
      expect(errorHandlingService.returnErrorOnInternalServerError).toHaveBeenCalled();
    });
  });

  describe('mget', () => {
    it('should get multiple values from cache', async () => {
      const keys = ['key1', 'key2'];
      const expectedValues = ['value1', 'value2'];

      mockCacheManager.get
        .mockResolvedValueOnce('value1')
        .mockResolvedValueOnce('value2');

      const result = await service.mget(keys);

      expect(result).toEqual(expectedValues);
      expect(cacheManager.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('mset', () => {
    it('should set multiple values in cache', async () => {
      const entries = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
      ];
      const ttl = 3600;

      mockCacheManager.set.mockResolvedValue(undefined);

      await service.mset(entries, { ttl });

      expect(cacheManager.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('mdel', () => {
    it('should delete multiple values from cache', async () => {
      const keys = ['key1', 'key2'];

      mockCacheManager.del.mockResolvedValue(undefined);

      await service.mdel(keys);

      expect(cacheManager.del).toHaveBeenCalledTimes(2);
    });
  });
});
