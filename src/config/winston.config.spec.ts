import { winstonConfig } from './winston.config';

describe('WinstonConfig', () => {
  it('should have a console transport', () => {
    expect(winstonConfig?.transports).toHaveLength(1);
    expect(winstonConfig?.transports[0]?.name).toBe('console');
  });

  it('should have the correct log level', () => {
    expect(winstonConfig?.level).toBe('info');
  });

  it('should have the correct default meta', () => {
    expect(winstonConfig?.defaultMeta).toEqual({ service: 'magasinx-api' });
  });
});
