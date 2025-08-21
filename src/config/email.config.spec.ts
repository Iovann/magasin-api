
import { EmailConfig } from './email.config';
import { validate } from 'class-validator';

describe('EmailConfig', () => {
  const createConfig = (envVars: Record<string, string> = {}): EmailConfig => {
    const config = new EmailConfig();
    config.emailFrom = envVars.EMAIL_FROM || 'default@example.com';
    config.googleAppPassword = envVars.GOOGLE_APP_PASSWORD || 'default_password';
    return config;
  };

  describe('Validation', () => {
    it('should validate a correct configuration', async () => {
      const config = createConfig({
        EMAIL_FROM: 'test@example.com',
        GOOGLE_APP_PASSWORD: 'test_password',
      });
      const errors = await validate(config);
      expect(errors.length).toBe(0);
    });

    it('should fail validation if emailFrom is missing', async () => {
      const config = new EmailConfig();
      config.googleAppPassword = 'test_password';
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('emailFrom');
    });

    it('should fail validation if googleAppPassword is missing', async () => {
      const config = new EmailConfig();
      config.emailFrom = 'test@example.com';
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('googleAppPassword');
    });
  });

  describe('Defaults', () => {
    it('should use default values when environment variables are not set', () => {
      const config = createConfig();
      expect(config.emailFrom).toBe('default@example.com');
      expect(config.googleAppPassword).toBe('default_password');
    });
  });

  describe('Environment Variables', () => {
    it('should load configuration from environment variables', () => {
      const config = createConfig({
        EMAIL_FROM: 'env@example.com',
        GOOGLE_APP_PASSWORD: 'env_password',
      });
      expect(config.emailFrom).toBe('env@example.com');
      expect(config.googleAppPassword).toBe('env_password');
    });
  });
});
