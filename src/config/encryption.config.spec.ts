import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EncryptionConfig } from './encryption.config';

describe('EncryptionConfig', () => {
    it('should be defined', () => {
        const config = new EncryptionConfig();
        expect(config).toBeDefined();
    });

    it('should validate when all properties are provided', async () => {
        const config = plainToInstance(EncryptionConfig, {
            cryptoSecret: 'super-secret-key',
            cryptoIV: 'initial-vector',
        });

        const errors = await validate(config);
        expect(errors.length).toBe(0);
    });

    it('should fail validation when properties are missing', async () => {
        const config = new EncryptionConfig();

        const errors = await validate(config);
        expect(errors.length).toBe(2);

        const propsWithErrors = errors.map((e) => e.property);
        expect(propsWithErrors).toEqual(
            expect.arrayContaining(['cryptoSecret', 'cryptoIV']),
        );
    });

    it('should fail validation when properties are empty strings', async () => {
        const config = plainToInstance(EncryptionConfig, {
            cryptoSecret: '',
            cryptoIV: '',
        });

        const errors = await validate(config);
        expect(errors.length).toBe(2);

        for (const error of errors) {
            expect(error.constraints?.isNotEmpty).toBeDefined();
        }
    });

    it('should fail validation when properties are not strings', async () => {
        const config = plainToInstance(EncryptionConfig, {
            cryptoSecret: 123,
            cryptoIV: {},
        });

        const errors = await validate(config);
        expect(errors.length).toBe(2);

        for (const error of errors) {
            expect(error.constraints?.isString).toBeDefined();
        }
    });
});
