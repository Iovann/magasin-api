import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./services/users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { Role } from "../../common/enum/role.enum";
import { User } from "./entities/user.entity";
import { ConflictException, NotFoundException } from "@nestjs/common";

describe("UsersController", () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUser: User = {
    id: "1",
    email: "test@example.com",
    role: Role.Vendeur,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    isBlocked: false,
  };

  const mockCreateUserDto: CreateUserDto = {
    email: "new@example.com",
    password: "password123",
    role: Role.Magasinier,
  };

  beforeEach(async () => {
    const mockUsersService: Partial<jest.Mocked<UsersService>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      getUserStats: jest.fn(),
      blockUser: jest.fn(), // Add this
      unblockUser: jest.fn(), // Add this
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a new user", async () => {
      // Arrange
      usersService.create.mockResolvedValue(mockUser);

      // Act
      const result = await controller.create(mockCreateUserDto);

      // Assert
      expect(usersService.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe("findAll", () => {
    it("should return all users", async () => {
      // Arrange
      const mockUsers = [
        mockUser,
        { ...mockUser, id: "2", email: "user2@example.com" },
      ];
      usersService.findAll.mockResolvedValue(mockUsers);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(usersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe("findOne", () => {
    it("should return a specific user", async () => {
      // Arrange
      usersService.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await controller.findOne("1");

      // Assert
      expect(usersService.findOne).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockUser);
    });
  });

  describe("remove", () => {
    it("should remove a user", async () => {
      // Arrange
      usersService.remove.mockResolvedValue(undefined);

      // Act
      await controller.remove("1");

      // Assert
      expect(usersService.remove).toHaveBeenCalledWith("1");
    });
  });

  describe("getStats", () => {
    it("should return user statistics", async () => {
      // Arrange
      const mockStats = {
        total: 3,
        byRole: {
          [Role.SuperAdmin]: 1,
          [Role.Magasinier]: 1,
          [Role.Vendeur]: 1,
        },
      };
      usersService.getUserStats.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getStats();

      // Assert
      expect(usersService.getUserStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('blockUser', () => {
    it('should block a user successfully', async () => {
      const mockBlockedUser = { ...mockUser, isBlocked: true } as User;
      usersService.blockUser.mockResolvedValue(mockBlockedUser);

      const result = await controller.blockUser('1');

      expect(usersService.blockUser).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockBlockedUser);
    });

    it('should rethrow NotFoundException from service', async () => {
      usersService.blockUser.mockImplementation(() => { throw new NotFoundException('User not found'); });

      await expect(controller.blockUser('999')).rejects.toThrow(NotFoundException);
      expect(usersService.blockUser).toHaveBeenCalledWith('999');
    });

    it('should rethrow ConflictException from service', async () => {
      usersService.blockUser.mockImplementation(() => { throw new ConflictException('User already blocked'); });

      await expect(controller.blockUser('1')).rejects.toThrow(ConflictException);
      expect(usersService.blockUser).toHaveBeenCalledWith('1');
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user successfully', async () => {
      const mockUnblockedUser = { ...mockUser, isBlocked: false } as User;
      usersService.unblockUser.mockResolvedValue(mockUnblockedUser);

      const result = await controller.unblockUser('1');

      expect(usersService.unblockUser).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockUnblockedUser);
    });

    it('should rethrow NotFoundException from service', async () => {
      usersService.unblockUser.mockImplementation(() => { throw new NotFoundException('User not found'); });

      await expect(controller.unblockUser('999')).rejects.toThrow(NotFoundException);
      expect(usersService.unblockUser).toHaveBeenCalledWith('999');
    });

    it('should rethrow ConflictException from service', async () => {
      usersService.unblockUser.mockImplementation(() => { throw new ConflictException('User not blocked'); });

      await expect(controller.unblockUser('1')).rejects.toThrow(ConflictException);
      expect(usersService.unblockUser).toHaveBeenCalledWith('1');
    });
  });
});
