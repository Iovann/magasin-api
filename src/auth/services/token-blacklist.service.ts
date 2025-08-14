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
    
    try {
      await this.cacheService.set(key, true, { ttl: effectiveTtl });
      this.logger.log(`Token blacklisted successfully with TTL: ${effectiveTtl}s`);
    } catch (error) {
      this.logger.error(`Failed to blacklist token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if a token is blacklisted.
   * @param token - The JWT token to check.
   * @returns True if the token is blacklisted, false otherwise.
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const key = this.blacklistPrefix + token;
    try {
      const isBlacklisted = await this.cacheService.has(key);
      this.logger.log(`Token blacklist check: ${isBlacklisted ? 'BLACKLISTED' : 'VALID'} (${token.substring(0, 20)}...)`);
      return isBlacklisted;
    } catch (error) {
      this.logger.error(`Failed to check token blacklist: ${error.message}`);
      // En cas d'erreur de cache, on considère le token comme non blacklisté
      // pour éviter de bloquer les utilisateurs légitimes
      return false;
    }
  }

  /**
   * Remove a token from the blacklist.
   * @param token - The JWT token to remove.
   */
  async removeFromBlacklist(token: string): Promise<void> {
    const key = this.blacklistPrefix + token;
    try {
      await this.cacheService.delete(key);
      this.logger.log('Token removed from blacklist');
    } catch (error) {
      this.logger.error(`Failed to remove token from blacklist: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear the entire blacklist.
   * Note: This can be a heavy operation depending on the cache store.
   */
  async clearBlacklist(): Promise<void> {
    this.logger.warn('Clearing entire blacklist - this is a heavy operation');
    try {
      await this.cacheService.clear();
      this.logger.log('Blacklist cleared successfully');
    } catch (error) {
      this.logger.error(`Failed to clear blacklist: ${error.message}`);
      throw error;
    }
  }
}
