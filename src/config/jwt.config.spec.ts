
import { JwtConfig } from './jwt.config';
import { validate } from 'class-validator';

describe('JwtConfig', () => {
  const createConfig = (envVars: Record<string, string> = {}): JwtConfig => {
    const config = new JwtConfig();
    config.secret = envVars.JWT_SECRET || 'default_secret';
    config.expirationTime = envVars.JWT_EXPIRATION_TIME || '3600s';
    config.refreshSecret = envVars.JWT_REFRESH_SECRET || 'default_refresh_secret';
    config.refreshExpirationTime = envVars.JWT_REFRESH_EXPIRATION_TIME || '86400s';
    return config;
  };

  describe('Validation', () => {
    it('should validate a correct configuration', async () => {
      const config = createConfig({
        JWT_SECRET: 'test_secret',
        JWT_EXPIRATION_TIME: '1800s',
        JWT_REFRESH_SECRET: 'test_refresh_secret',
        JWT_REFRESH_EXPIRATION_TIME: '604800s',
      });
      const errors = await validate(config);
      expect(errors.length).toBe(0);
    });

    it('should fail if secret is missing', async () => {
      const config = new JwtConfig();
      config.expirationTime = '1h';
      config.refreshSecret = 'refresh';
      config.refreshExpirationTime = '1d';
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('secret');
    });

    // Add similar tests for other missing fields...
  });

  describe('Environment Variables', () => {
    it('should load configuration from environment variables', () => {
      const config = createConfig({
        JWT_SECRET: 'env_secret',
        JWT_EXPIRATION_TIME: '30m',
        JWT_REFRESH_SECRET: 'env_refresh_secret',
        JWT_REFRESH_EXPIRATION_TIME: '12h',
      });
      expect(config.secret).toBe('env_secret');
      expect(config.expirationTime).toBe('30m');
      expect(config.refreshSecret).toBe('env_refresh_secret');
      expect(config.refreshExpirationTime).toBe('12h');
    });
  });
});
