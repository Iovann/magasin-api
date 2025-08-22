import { Inject, Injectable, Logger } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { ErrorHandlingService } from "src/common/response/error-handling";

/**
 * A wrapper service for the NestJS CacheManager to provide a consistent API
 * and add useful helper methods for cache interaction.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly errorHandlingService: ErrorHandlingService,
  ) {}

  /**
   * Basic key validation to avoid subtle runtime issues.
   */
  private validateKey(key: string, context: string) {
    if (!key || typeof key !== "string") {
      this.errorHandlingService.returnErrorOnBadRequest(
        `[ERR_001_CACHE_${context}] Invalid cache key provided`,
        "Invalid cache key. Key must be a non-empty string.",
      );
    }
  }

  /** 
   * Basic TTL validation to avoid subtle runtime issues.
   */
  private validateTTL(ttl?: number, context?: string) {
    if (
      ttl !== undefined &&
      (typeof ttl !== "number" || Number.isNaN(ttl) || ttl < 0)
    ) {
      this.errorHandlingService.returnErrorOnBadRequest(
        `[ERR_002_CACHE_${context}] Invalid TTL provided`,
        "Invalid TTL. TTL must be a non-negative number in seconds.",
      );
    }
  }

  /**
   * Retrieves an item from the cache.
   * @param key The key of the item to retrieve.
   * @returns The cached item, or undefined if the item does not exist.
   * @example
   * const user = await cacheService.get<User>('user:1');
   */
  async get<T>(key: string): Promise<T | undefined> {
    this.validateKey(key, "GET");
    try {
      this.logger.log(`[CacheService] Attempting to GET key: ${key}`);
      return await this.cacheManager.get<T>(key);
    } catch (error: any) {
      this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_CACHE_GET] Failed to get key="${key}": ${error?.message || error}`,
        "An error occurred while accessing the cache.",
      );
    }
    // Fallback to satisfy TS (unreachable if above throws)
    return undefined as any;
  }

  /**
   * Sets an item in the cache.
   * @param key The key under which to store the item.
   * @param value The item to store.
   * @param ttl Optional. The time-to-live in seconds for the cached item.
   * @example
   * await cacheService.set('user:1', userObject, { ttl: 3600 });
   */
  async set<T>(
    key: string,
    value: T,
    { ttl }: { ttl?: number },
  ): Promise<void> {
    this.validateKey(key, "SET");
    this.validateTTL(ttl, "SET");
    try {
      this.logger.log(`[CacheService] Attempting to SET key: ${key}`);
      await this.cacheManager.set(
        key,
        value,
        ttl !== undefined ? { ttl } : (undefined as any),
      );
      this.logger.log(`[CacheService] SET operation completed for key: ${key}`);
    } catch (error: any) {
      this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_CACHE_SET] Failed to set key="${key}": ${error?.message || error}`,
        "An error occurred while writing to the cache.",
      );
    }
  }

  /**
   * Deletes an item from the cache.
   * @param key The key of the item to delete.
   * @example
   * await cacheService.delete('user:1');
   */
  async delete(key: string): Promise<void> {
    this.validateKey(key, "DELETE");
    try {
      this.logger.log(`[CacheService] Attempting to DELETE key: ${key}`);
      await this.cacheManager.del(key);
      this.logger.log(
        `[CacheService] DELETE operation completed for key: ${key}`,
      );
    } catch (error: any) {
      this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_CACHE_DELETE] Failed to delete key="${key}": ${error?.message || error}`,
        "An error occurred while deleting from the cache.",
      );
    }
  }

  /**
   * Clears the entire cache.
   * Note: This is a destructive operation and should be used with caution.
   * It calls the underlying store's 'reset' method, which typically flushes the entire database.
   * @example
   * await cacheService.clear();
   */
  async clear(): Promise<void> {
    try {
      const store = (this.cacheManager as any).store || this.cacheManager;
      if (typeof store.flushAll === "function") {
        await store.flushAll();
        return;
      }
      if (typeof store.keys === "function") {
        const keys: string[] = await store.keys("*");
        if (Array.isArray(keys) && keys.length > 0) {
          await Promise.all(keys.map((k: string) => this.cacheManager.del(k)));
        }
        return;
      }
      // No supported clearing mechanism
      this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_001_CACHE_CLEAR] Cache clear not supported by this store`,
        "Cache clear is not supported by the configured cache store.",
      );
    } catch (error: any) {
      this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_CACHE_CLEAR] Failed to clear cache: ${error?.message || error}`,
        "An error occurred while clearing the cache.",
      );
    }
  }

  /**
   * Caches the result of a function. If the key exists in cache, returns the cached value.
   * Otherwise, executes the function, caches its result, and returns it.
   * @param key The key to use for caching.
   * @param fn The function to execute to get the value if it's not in the cache.
   * @param ttl Optional. The time-to-live in seconds for the cached item.
   * @returns The result of the function, either from cache or newly executed.
   * @example
   * const users = await cacheService.wrap('all_users', () => this.userService.findAll(), { ttl: 3600 });
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    { ttl }: { ttl?: number },
  ): Promise<T> {
    this.validateKey(key, "WRAP");
    this.validateTTL(ttl, "WRAP");
    try {
      return await this.cacheManager.wrap(key, fn, { ttl });
    } catch (error: any) {
      this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_CACHE_WRAP] Failed to wrap key="${key}": ${error?.message || error}`,
        "An error occurred while wrapping the cache operation.",
      );
    }
    // Fallback to satisfy TS (unreachable if above throws)
    return undefined as any;
  }

  /**
   * A custom implementation to get an item, or set it if it doesn't exist.
   * Useful when the `wrap` method's behavior is not exactly what's needed.
   * @param key The key to get or set.
   * @param fn The function to execute to get the value if it's not in the cache.
   * @param ttl Optional. The time-to-live in seconds for the cached item.
   * @returns The result of the function, either from cache or newly executed.
   * @example
   * const user = await cacheService.getOrSet('user:1', () => this.userService.findOne(1), { ttl: 3600 });
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    { ttl }: { ttl?: number },
  ): Promise<T> {
    this.validateKey(key, "GETORSET");
    this.validateTTL(ttl, "GETORSET");
    try {
      const cached = await this.get<T>(key);
      if (cached !== undefined && cached !== null) {
        return cached;
      }
      const result = await fn();
      await this.set(key, result, { ttl });
      return result;
    } catch (error: any) {
      return this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_CACHE_GETORSET] Failed for key="${key}": ${error?.message || error}`,
        "An error occurred during cache get-or-set operation.",
      ) as never;
    }
  }

  /**
   * Checks if a key exists in the cache.
   * @param key The key to check.
   * @returns True if the key exists, false otherwise.
   * @example
   * const userExists = await cacheService.has('user:1');
   */
  async has(key: string): Promise<boolean> {
    this.validateKey(key, "HAS");
    try {
      const value = await this.get(key);
      return value !== undefined && value !== null;
    } catch (error: any) {
      this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_CACHE_HAS] Failed to verify key="${key}": ${error?.message || error}`,
        "An error occurred while checking cache key existence.",
      );
    }
    // Fallback to satisfy TS (unreachable if above throws)
    return false as any;
  }

  /**
   * Gets all keys matching a pattern from the cache store.
   * WARNING: Do not use with broad patterns like '*' in production on a large dataset,
   * as it can block the Redis/Valkey server.
   * @param pattern The pattern to match keys against (e.g., 'user:*'). Defaults to '*'.
   * @returns An array of keys.
   * @example
   * const userKeys = await cacheService.keys('user:*');
   */
  async keys(pattern = "*"): Promise<string[]> {
    try {
      const store = (this.cacheManager as any).store || this.cacheManager;
      if (typeof store.keys === "function") {
        return await store.keys(pattern);
      }
      return [];
    } catch (error: any) {
      this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_CACHE_KEYS] Failed to fetch keys for pattern="${pattern}": ${error?.message || error}`,
        "An error occurred while listing cache keys.",
      );
    }
    // Fallback to satisfy TS (unreachable if above throws)
    return [] as any;
  }

  /**
   * Retrieves multiple items from the cache.
   * @param keys An array of keys to retrieve.
   * @returns An array of cached items. The order is the same as the input keys.
   * If a key is not found, the corresponding item in the array will be undefined.
   * @example
   * const users = await cacheService.mget<User>(['user:1', 'user:2']);
   */
  async mget<T>(keys: string[]): Promise<Array<T | undefined>> {
    try {
      // The default cache-manager mget might not return a correctly typed array,
      // so implementing it manually with Promise.all is safer.
      const promises = keys.map((key) => this.get<T>(key));
      return await Promise.all(promises);
    } catch (error: any) {
      this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_CACHE_MGET] Failed to get multiple keys: ${error?.message || error}`,
        "An error occurred while reading multiple cache keys.",
      );
    }
    // Fallback to satisfy TS (unreachable if above throws)
    return [] as any;
  }

  /**
   * Sets multiple items in the cache.
   * @param entries An array of key-value pairs to set.
   * @param ttl Optional. The time-to-live in seconds for the cached items.
   * @example
   * await cacheService.mset([
   *   { key: 'user:1', value: user1 },
   *   { key: 'user:2', value: user2 }
   * ], { ttl: 3600 });
   */
  async mset<T>(
    entries: Array<{ key: string; value: T }>,
    { ttl }: { ttl?: number },
  ): Promise<void> {
    try {
      if (!Array.isArray(entries)) {
        this.errorHandlingService.returnErrorOnBadRequest(
          `[ERR_001_CACHE_MSET] Entries must be an array`,
          "Invalid entries parameter for mset.",
        );
      }
      this.validateTTL(ttl, "MSET");
      const promises = entries.map(({ key, value }) =>
        this.set(key, value, { ttl }),
      );
      await Promise.all(promises);
    } catch (error: any) {
      this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_CACHE_MSET] Failed to set multiple keys: ${error?.message || error}`,
        "An error occurred while writing multiple cache keys.",
      );
    }
  }

  /**
   * Deletes multiple items from the cache.
   * @param keys An array of keys to delete.
   * @example
   * await cacheService.mdel(['user:1', 'user:2']);
   */
  async mdel(keys: string[]): Promise<void> {
    try {
      if (!Array.isArray(keys)) {
        this.errorHandlingService.returnErrorOnBadRequest(
          `[ERR_001_CACHE_MDEL] Keys must be an array`,
          "Invalid keys parameter for mdel.",
        );
      }
      const promises = keys.map((key) => this.delete(key));
      await Promise.all(promises);
    } catch (error: any) {
      this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_CACHE_MDEL] Failed to delete multiple keys: ${error?.message || error}`,
        "An error occurred while deleting multiple cache keys.",
      );
    }
  }
}
