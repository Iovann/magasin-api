import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private readonly blacklistPrefix = 'blacklist:';

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Add a token to the blacklist with a TTL.
   * @param token - The JWT token to blacklist.
   * @param ttl - The time to live for the token in seconds.
   */
  async addToBlacklist(token: string, ttl: number): Promise<void> {
    const key = this.blacklistPrefix + token;
    const effectiveTtl = ttl > 0 ? Math.ceil(ttl) : undefined;
    
    this.logger.debug(`[TokenBlacklistService] Attempting to SET key: ${key}, TTL: ${effectiveTtl}`);
    await this.cacheService.set(key, true, { ttl: effectiveTtl });
    this.logger.debug(`[TokenBlacklistService] SET operation completed for key: ${key}`);

    // Immediate GET to verify persistence
    const retrieved = await this.cacheService.get(key);
    this.logger.debug(`[TokenBlacklistService] Retrieved after SET for key ${key}: ${retrieved ? 'found' : 'not found'}`);

    this.logger.log(`Token added to blacklist with a TTL of ${effectiveTtl} seconds.`);
  }

  /**
   * Check if a token is blacklisted.
   * @param token - The JWT token to check.
   * @returns True if the token is blacklisted, false otherwise.
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const key = this.blacklistPrefix + token;
    this.logger.debug(`[TokenBlacklistService] Attempting to GET key: ${key} for blacklist check.`);
    const isBlacklisted = await this.cacheService.has(key);
    this.logger.debug(`[TokenBlacklistService] Blacklist check result for key ${key}: ${isBlacklisted}`);
    return isBlacklisted;
  }

  /**
   * Remove a token from the blacklist.
   * @param token - The JWT token to remove.
   */
  async removeFromBlacklist(token: string): Promise<void> {
    const key = this.blacklistPrefix + token;
    this.logger.debug(`[TokenBlacklistService] Attempting to DEL key: ${key}`);
    await this.cacheService.delete(key);
    this.logger.log('Token removed from blacklist');
  }

  /**
   * Clear the entire blacklist.
   * Note: This can be a heavy operation depending on the cache store.
   */
  async clearBlacklist(): Promise<void> {
    this.logger.warn(`[TokenBlacklistService] Clearing entire blacklist.`);
    await this.cacheService.clear();
    this.logger.log('Blacklist cleared');
  }
}
