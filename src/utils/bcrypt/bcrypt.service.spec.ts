import { Test, TestingModule } from '@nestjs/testing';
import { BcryptService } from './bcrypt.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn((password, saltRounds) => Promise.resolve(`hashed_${password}_${saltRounds}`)),
  compare: jest.fn((password, hash) => Promise.resolve(hash === `hashed_${password}_10`)),
}));

describe('BcryptService', () => {
  let service: BcryptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BcryptService],
    }).compile();

    service = module.get<BcryptService>(BcryptService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword';
      const hashedPassword = await service.hashPassword(password);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10); // Assuming default saltRounds is 10
      expect(hashedPassword).toBe(`hashed_${password}_10`);
    });

    it('should return a different hash for the same password due to salt', async () => {
      // Reset mock to allow actual bcrypt behavior for this test or simulate different salt
      (bcrypt.hash as jest.Mock).mockImplementationOnce((password, saltRounds) => Promise.resolve(`hashed_${password}_${saltRounds}_salt1`));
      (bcrypt.hash as jest.Mock).mockImplementationOnce((password, saltRounds) => Promise.resolve(`hashed_${password}_${saltRounds}_salt2`));

      const password = 'testpassword';
      const hash1 = await service.hashPassword(password);
      const hash2 = await service.hashPassword(password);

      expect(hash1).not.toBe(hash2);
      expect(hash1).toContain('hashed_testpassword_10');
      expect(hash2).toContain('hashed_testpassword_10');
    });
  });

  describe('comparePassword', () => {
    it('should return true for a matching password and hash', async () => {
      const password = 'testpassword';
      const hash = 'hashed_testpassword_10'; // Based on our mock hash
      const isMatch = await service.comparePassword(password, hash);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should return false for a non-matching password and hash', async () => {
      const password = 'wrongpassword';
      const hash = 'hashed_testpassword_10';
      const isMatch = await service.comparePassword(password, hash);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(isMatch).toBe(false);
    });
  });
});
