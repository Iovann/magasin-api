import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { UserInitService } from './user-init.service';
import { UsersService } from './users.service';
import { Role } from '../../../common/enum/role.enum';
import { User } from '../entities/user.entity';

describe('UserInitService', () => {
  let service: UserInitService;
  let usersService: jest.Mocked<UsersService>;
  let logger: jest.Mocked<Logger>;

  const mockSuperAdmin: User = {
    id: '1',
    email: 'admin@gunshop.com',
    role: Role.SuperAdmin,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockVendeur: User = {
    id: '2',
    email: 'vendeur@gunshop.com',
    role: Role.Vendeur,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const mockUsersService: Partial<jest.Mocked<UsersService>> = {
      findAll: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserInitService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<UserInitService>(UserInitService);
    usersService = module.get(UsersService);

    // Mock the logger
    logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    // Replace the private logger with our mock
    (service as any).logger = logger;

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onApplicationBootstrap', () => {
    it('should call createDefaultSuperAdmin on bootstrap', async () => {
      // Arrange
      usersService.findAll.mockResolvedValue([]);
      usersService.create.mockResolvedValue(mockSuperAdmin);

      // Act
      await service.onApplicationBootstrap();

      // Assert
      expect(usersService.findAll).toHaveBeenCalled();
      expect(usersService.create).toHaveBeenCalled();
    });
  });

  describe('createDefaultSuperAdmin', () => {
    it('should create Super Admin when none exists', async () => {
      // Arrange
      usersService.findAll.mockResolvedValue([mockVendeur]); // Only Vendeur, no SuperAdmin
      usersService.create.mockResolvedValue(mockSuperAdmin);

      // Act
      await service.onApplicationBootstrap();

      // Assert
      expect(usersService.findAll).toHaveBeenCalled();
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'admin@gunshop.com',
        password: 'SuperAdmin123!',
        role: Role.SuperAdmin,
      });
      expect(logger.log).toHaveBeenCalledWith('🔐 Default Super Admin created:');
      expect(logger.log).toHaveBeenCalledWith('   Email: admin@gunshop.com');
      expect(logger.log).toHaveBeenCalledWith('   ID: 1');
      expect(logger.log).toHaveBeenCalledWith('   Password: SuperAdmin123!');
      expect(logger.warn).toHaveBeenCalledWith('⚠️  CHANGE THE DEFAULT PASSWORD IMMEDIATELY!');
    });

    it('should not create Super Admin when one already exists', async () => {
      // Arrange
      usersService.findAll.mockResolvedValue([mockSuperAdmin, mockVendeur]);

      // Act
      await service.onApplicationBootstrap();

      // Assert
      expect(usersService.findAll).toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('✅ Super Admin already exists');
    });

    it('should create Super Admin when users list is empty', async () => {
      // Arrange
      usersService.findAll.mockResolvedValue([]);
      usersService.create.mockResolvedValue(mockSuperAdmin);

      // Act
      await service.onApplicationBootstrap();

      // Assert
      expect(usersService.findAll).toHaveBeenCalled();
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'admin@gunshop.com',
        password: 'SuperAdmin123!',
        role: Role.SuperAdmin,
      });
      expect(logger.log).toHaveBeenCalledWith('🔐 Default Super Admin created:');
    });

    it('should handle errors gracefully when creation fails', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      usersService.findAll.mockResolvedValue([]);
      usersService.create.mockRejectedValue(error);

      // Act
      await service.onApplicationBootstrap();

      // Assert
      expect(usersService.findAll).toHaveBeenCalled();
      expect(usersService.create).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to create default Super Admin:',
        'Database connection failed'
      );
    });

    it('should handle errors gracefully when findAll fails', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      usersService.findAll.mockRejectedValue(error);

      // Act
      await service.onApplicationBootstrap();

      // Assert
      expect(usersService.findAll).toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to create default Super Admin:',
        'Database connection failed'
      );
    });

    it('should detect Super Admin among multiple users with different roles', async () => {
      // Arrange
      const mockUsers = [
        { ...mockVendeur, id: '1' },
        { ...mockVendeur, id: '2', role: Role.Magasinier },
        mockSuperAdmin,
        { ...mockVendeur, id: '4', role: Role.Vendeur },
      ];
      usersService.findAll.mockResolvedValue(mockUsers);

      // Act
      await service.onApplicationBootstrap();

      // Assert
      expect(usersService.findAll).toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('✅ Super Admin already exists');
    });

    it('should create Super Admin with exact default credentials', async () => {
      // Arrange
      usersService.findAll.mockResolvedValue([]);
      usersService.create.mockResolvedValue(mockSuperAdmin);

      // Act
      await service.onApplicationBootstrap();

      // Assert
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'admin@gunshop.com',
        password: 'SuperAdmin123!',
        role: Role.SuperAdmin,
      });
    });

    it('should log all required information after successful creation', async () => {
      // Arrange
      usersService.findAll.mockResolvedValue([]);
      usersService.create.mockResolvedValue(mockSuperAdmin);

      // Act
      await service.onApplicationBootstrap();

      // Assert
      expect(logger.log).toHaveBeenCalledTimes(4); // 4 log calls for success
      expect(logger.warn).toHaveBeenCalledTimes(1); // 1 warning call
      expect(logger.error).not.toHaveBeenCalled(); // No error calls
    });
  });
});
