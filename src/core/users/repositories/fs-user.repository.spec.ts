import { Test, TestingModule } from '@nestjs/testing';
import { FsUserRepository } from './fs-user.repository';
import { DatabaseConfig } from '../../../config/database.config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { User } from '../entities/user.entity';
import { Role } from '../../../common/enum/role.enum';

// Mocking des modules 'fs' et 'crypto'
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue('[]'),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('mocked-user-uuid-456'),
}));

describe('FsUserRepository', () => {
  let repository: FsUserRepository;
  let mockDbConfig: DatabaseConfig;

  beforeEach(async () => {
    mockDbConfig = { dbPath: './test-data' } as DatabaseConfig;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FsUserRepository,
        { provide: DatabaseConfig, useValue: mockDbConfig },
      ],
    }).compile();

    repository = module.get<FsUserRepository>(FsUserRepository);
    await repository.onModuleInit();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user and persist it', async () => {
      const userData: Omit<User, 'id' | 'createdAt'> = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: Role.Vendeur,
      };

      const result = await repository.create(userData);

      expect(result.id).toBe('mocked-user-uuid-456');
      expect(result.email).toBe(userData.email);

      expect(fs.writeFile).toHaveBeenCalledTimes(1);
      const expectedData = JSON.stringify([result], null, 2);
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.resolve(mockDbConfig.dbPath, 'users.json'),
        expectedData,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user if email is found', async () => {
      const mockUser: User = {
        id: '123',
        email: 'findme@example.com',
        passwordHash: 'hash',
        role: Role.Vendeur,
        createdAt: new Date(),
      };
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([mockUser]));
      await repository.onModuleInit();

      const result = await repository.findByEmail('findme@example.com');

      expect(result).toBeDefined();
      expect(result?.email).toBe('findme@example.com');
    });

    it('should return null if email is not found', async () => {
      const result = await repository.findByEmail('notfound@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
        const mockUsers: User[] = [
            { id: '1', email: 'a@a.com', passwordHash: 'h1', role: Role.Vendeur, createdAt: new Date() },
            { id: '2', email: 'b@b.com', passwordHash: 'h2', role: Role.Magasinier, createdAt: new Date() },
        ];
        (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockUsers));
        await repository.onModuleInit();

        const result = await repository.findAll();
        expect(result).toHaveLength(2);
        expect(result[1].email).toBe('b@b.com');
    });
  });
});
