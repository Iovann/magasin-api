import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoUserRepository } from './mongo-user.repository';
import { MongoUser } from '../entities/mongo-user.entity';
import { User } from '../entities/user.entity';
import { Role } from '../../../common/enum/role.enum';

describe('MongoUserRepository', () => {
  let repository: MongoUserRepository;
  let userModel: jest.Mocked<Model<MongoUser>>;

  const mockMongoUser = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    passwordHash: 'hashedPassword123',
    role: Role.Vendeur,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    save: jest.fn(),
    toObject: jest.fn(),
  } as any;

  const mockUser: User = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    role: Role.Vendeur,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockUserData = {
    email: 'new@example.com',
    passwordHash: 'hashedPassword456',
    role: Role.Magasinier,
  };

  beforeEach(async () => {
    // Create a mock constructor function that returns the mock instance
    const MockUserModel = jest.fn().mockImplementation(() => ({
      ...mockMongoUser,
      save: jest.fn().mockResolvedValue(mockMongoUser),
      toObject: jest.fn().mockReturnValue(mockMongoUser),
    }));

    // Add static methods to the mock constructor
    MockUserModel.findById = jest.fn();
    MockUserModel.findOne = jest.fn();
    MockUserModel.find = jest.fn();
    MockUserModel.findByIdAndDelete = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoUserRepository,
        {
          provide: getModelToken(MongoUser.name),
          useValue: MockUserModel,
        },
      ],
    }).compile();

    repository = module.get<MongoUserRepository>(MongoUserRepository);
    userModel = module.get<Model<MongoUser>>(getModelToken(MongoUser.name));

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const mockSavedUser = { 
        ...mockMongoUser, 
        ...mockUserData,
        save: jest.fn().mockResolvedValue(mockMongoUser),
        toObject: jest.fn().mockReturnValue(mockMongoUser)
      };
      
      // The userModel is already a constructor mock from beforeEach
      (userModel as any).mockReturnValue(mockSavedUser);

      // Act
      const result = await repository.create(mockUserData);

      // Assert
      expect(result).toEqual({
        id: mockMongoUser.id,
        email: mockMongoUser.email,
        role: mockMongoUser.role,
        createdAt: mockMongoUser.createdAt,
      });
      expect(mockSavedUser.save).toHaveBeenCalled();
    });

    it('should log user creation details', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockSavedUser = { 
        ...mockMongoUser, 
        ...mockUserData,
        save: jest.fn().mockResolvedValue(mockMongoUser),
        toObject: jest.fn().mockReturnValue(mockMongoUser)
      };
      
      (userModel as any).mockReturnValue(mockSavedUser);

      // Act
      await repository.create(mockUserData);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('🍃 MongoUserRepository.create called with:', JSON.stringify(mockUserData, null, 2));
      expect(consoleSpy).toHaveBeenCalledWith('🍃 User data keys:', Object.keys(mockUserData));
      expect(consoleSpy).toHaveBeenCalledWith('🍃 Email value:', mockUserData.email);

      consoleSpy.mockRestore();
    });
  });

  describe('findById', () => {
    it('should find user by id successfully', async () => {
      // Arrange
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockMongoUser),
      };
      userModel.findById.mockReturnValue(mockQuery as any);

      // Act
      const result = await repository.findById('507f1f77bcf86cd799439011');

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual({
        id: mockMongoUser.id,
        email: mockMongoUser.email,
        role: mockMongoUser.role,
        createdAt: mockMongoUser.createdAt,
      });
    });

    it('should return null when user not found by id', async () => {
      // Arrange
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };
      userModel.findById.mockReturnValue(mockQuery as any);

      // Act
      const result = await repository.findById('nonexistent');

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email successfully', async () => {
      // Arrange
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockMongoUser),
      };
      userModel.findOne.mockReturnValue(mockQuery as any);

      // Act
      const result = await repository.findByEmail('test@example.com');

      // Assert
      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toEqual({
        id: mockMongoUser.id,
        email: mockMongoUser.email,
        role: mockMongoUser.role,
        createdAt: mockMongoUser.createdAt,
      });
    });

    it('should return null when user not found by email', async () => {
      // Arrange
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };
      userModel.findOne.mockReturnValue(mockQuery as any);

      // Act
      const result = await repository.findByEmail('notfound@example.com');

      // Assert
      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'notfound@example.com' });
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      // Arrange
      const mockUsers = [mockMongoUser, { ...mockMongoUser, id: '507f1f77bcf86cd799439012', email: 'user2@example.com' }];
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockUsers),
      };
      userModel.find.mockReturnValue(mockQuery as any);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(userModel.find).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: mockUsers[0].id,
        email: mockUsers[0].email,
        role: mockUsers[0].role,
        createdAt: mockUsers[0].createdAt,
      });
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      const mockQuery = {
        exec: jest.fn().mockResolvedValue([]),
      };
      userModel.find.mockReturnValue(mockQuery as any);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      // Arrange
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockMongoUser),
      };
      userModel.findByIdAndDelete.mockReturnValue(mockQuery as any);

      // Act
      await repository.delete('507f1f77bcf86cd799439011');

      // Assert
      expect(userModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should handle deletion of non-existent user', async () => {
      // Arrange
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };
      userModel.findByIdAndDelete.mockReturnValue(mockQuery as any);

      // Act
      await repository.delete('nonexistent');

      // Assert
      expect(userModel.findByIdAndDelete).toHaveBeenCalledWith('nonexistent');
      // Should not throw error even if user doesn't exist
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should find user with password hash by email', async () => {
      // Arrange
      const mockUserWithPassword = { ...mockMongoUser, passwordHash: 'hashedPassword123' };
      const mockSelectQuery = {
        exec: jest.fn().mockResolvedValue(mockUserWithPassword),
      };
      const mockQuery = {
        select: jest.fn().mockReturnValue(mockSelectQuery),
      };
      userModel.findOne.mockReturnValue(mockQuery as any);

      // Act
      const result = await repository.findByEmailWithPassword('test@example.com');

      // Assert
      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockQuery.select).toHaveBeenCalledWith('+passwordHash');
      expect(result).toEqual({
        id: mockUserWithPassword.id,
        email: mockUserWithPassword.email,
        role: mockUserWithPassword.role,
        createdAt: mockUserWithPassword.createdAt,
        passwordHash: 'hashedPassword123',
      });
    });

    it('should return null when user not found by email', async () => {
      // Arrange
      const mockSelectQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };
      const mockQuery = {
        select: jest.fn().mockReturnValue(mockSelectQuery),
      };
      userModel.findOne.mockReturnValue(mockQuery as any);

      // Act
      const result = await repository.findByEmailWithPassword('notfound@example.com');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when user found but no passwordHash', async () => {
      // Arrange
      const mockUserWithoutPassword = { ...mockMongoUser, passwordHash: undefined };
      const mockSelectQuery = {
        exec: jest.fn().mockResolvedValue(mockUserWithoutPassword),
      };
      const mockQuery = {
        select: jest.fn().mockReturnValue(mockSelectQuery),
      };
      userModel.findOne.mockReturnValue(mockQuery as any);

      // Act
      const result = await repository.findByEmailWithPassword('test@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('toUserEntity (private method)', () => {
    it('should transform MongoUser to User entity without passwordHash', () => {
      // This is tested implicitly through other methods
      // The private method excludes passwordHash from the returned User object
      // which is verified in the other test cases
    });
  });
});
