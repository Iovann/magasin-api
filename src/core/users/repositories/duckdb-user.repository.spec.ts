import { Test, TestingModule } from '@nestjs/testing';
import { DuckDBUserRepository } from '../../../../src/core/users/repositories/duckdb-user.repository';
import { DatabaseConfig } from '../../../../src/config/database.config';
import { Role } from '../../../../src/common/enum/role.enum';
import { DuckDBConnection } from '@duckdb/node-api';
import { DuckDBService } from '../../../../src/libs/database/duckdb.service';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mocked-uuid-1234'
  }
});

describe('DuckDBUserRepository', () => {
  let repository: DuckDBUserRepository;
  let mockConnection: jest.Mocked<DuckDBConnection>;
  let mockDuckDBService: jest.Mocked<DuckDBService>;
  
  const mockConfig: DatabaseConfig = {
    nodeEnv: 'development',
    dbPath: './test-db',
    dbType: 'duckdb',
  };

  const mockUser = {
    email: 'test@example.com',
    passwordHash: 'hashedPassword123',
    role: Role.Vendeur,
    isBlocked: false,
  };

  beforeEach(async () => {
    // Create mock DuckDB connection
    mockConnection = {
      run: jest.fn().mockResolvedValue(undefined),
      runAndReadAll: jest.fn().mockResolvedValue({
        getRowObjectsJS: jest.fn().mockReturnValue([{
          id: '1',
          email: 'test@example.com',
          passwordHash: 'hashedPassword123',
          role: Role.Vendeur,
          isBlocked: false,
          refreshToken: 'refresh-token',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }])
      }),
      closeSync: jest.fn(),
    } as unknown as jest.Mocked<DuckDBConnection>;

    // Mock DuckDBService
    mockDuckDBService = {
      getConnection: jest.fn().mockResolvedValue(mockConnection)
    } as unknown as jest.Mocked<DuckDBService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DuckDBUserRepository,
        {
          provide: DuckDBService,
          useValue: mockDuckDBService,
        },
        {
          provide: DatabaseConfig,
          useValue: mockConfig,
        },
      ],
    }).compile();

    repository = module.get<DuckDBUserRepository>(DuckDBUserRepository);
    
    // Wait for onModuleInit to complete
    await repository.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const result = await repository.create(mockUser);
      
      expect(result).toHaveProperty('id', 'mocked-uuid-1234');
      expect(result.email).toBe(mockUser.email);
      expect(result.role).toBe(mockUser.role);
      expect(mockConnection.run).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      const userId = '1';
      const user = await repository.findById(userId);
      
      expect(user).toBeDefined();
      expect(user?.id).toBe('1');
      expect(mockConnection.runAndReadAll).toHaveBeenCalledWith(
        `SELECT id, email, role, isBlocked, refreshToken, passwordHash, createdAt, updatedAt FROM users WHERE id = ?`,
        [userId]
      );
    });

    it('should return null if user not found', async () => {
      mockConnection.runAndReadAll = jest.fn().mockResolvedValueOnce({
        getRowObjectsJS: jest.fn().mockReturnValue([])
      });
      
      const user = await repository.findById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const email = 'test@example.com';
      const user = await repository.findByEmail(email);
      
      expect(user).toBeDefined();
      expect(user?.email).toBe(email);
      expect(mockConnection.runAndReadAll).toHaveBeenCalledWith(
        `SELECT id, email, role, isBlocked, refreshToken, passwordHash, createdAt, updatedAt FROM users WHERE email = ?`,
        [email]
      );
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should find a user by email with password hash', async () => {
      const email = 'test@example.com';
      const user = await repository.findByEmailWithPassword(email);
      
      expect(user).toBeDefined();
      expect(user?.email).toBe(email);
      expect(user?.passwordHash).toBeDefined();
      expect(mockConnection.runAndReadAll).toHaveBeenCalledWith(
        `SELECT * FROM users WHERE email = ?`,
        [email]
      );
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      mockConnection.runAndReadAll = jest.fn().mockResolvedValueOnce({
        getRowObjectsJS: jest.fn().mockReturnValue([
          { id: '1', email: 'test1@example.com', role: Role.Vendeur, isBlocked: false },
          { id: '2', email: 'test2@example.com', role: Role.SuperAdmin, isBlocked: false }
        ])
      });
      
      const users = await repository.findAll();
      
      expect(users).toHaveLength(2);
      expect(users[0]?.email).toBe('test1@example.com');
      expect(users[1]?.email).toBe('test2@example.com');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = '1';
      const updateData = { email: 'updated@example.com', role: Role.SuperAdmin };
      
      await repository.update(userId, updateData);
      
      expect(mockConnection.run).toHaveBeenCalledWith(
        `UPDATE users SET email = ?, role = ?, updatedAt = ? WHERE id = ?`,
        [updateData.email, updateData.role, expect.any(String), userId]
      );
    });

    it('should only update provided fields', async () => {
      const userId = '1';
      const updateData = { email: 'updated@example.com' };
      
      await repository.update(userId, updateData);
      
      expect(mockConnection.run).toHaveBeenCalledWith(
        `UPDATE users SET email = ?, updatedAt = ? WHERE id = ?`,
        [updateData.email, expect.any(String), userId]
      );
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const userId = '1';
      
      await repository.delete(userId);
      
      expect(mockConnection.run).toHaveBeenCalledWith(
        `DELETE FROM users WHERE id = ?`,
        [userId]
      );
    });
  });

  // describe('onModuleDestroy', () => {
  //   it('should close database connections', async () => {
  //     await repository.onModuleDestroy();
      
  //     expect(mockConnection.closeSync).toHaveBeenCalled();
  //     expect(mockDuckDBService.closeSync).toHaveBeenCalled();
  //   });
  // });
});
