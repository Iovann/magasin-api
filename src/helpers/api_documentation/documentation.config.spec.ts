import { CreateSwaggerConfig } from './documentation.config';

describe('CreateSwaggerConfig', () => {
    it('should return config and customOptions', () => {
        const { config, customOptions } = CreateSwaggerConfig();

        expect(config).toBeDefined();
        expect(config.info.title).toBe('FiduShare API');
        expect(config.info.version).toBe('1.0');
        expect(config.info.contact.name).toBe('FiduShare');
        expect(config.info.license.name).toBe('MIT');

        expect(customOptions).toBeDefined();
        expect(customOptions.swaggerOptions.url).toBe('/docs-json');
    });
});
