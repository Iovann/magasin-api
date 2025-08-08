import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { IUserRepository } from "../repositories/user.repository";
import { CreateUserDto } from "../dto/create-user.dto";
import { Role } from "../../../common/enum/role.enum";
import { User } from "../entities/user.entity";
import * as bcrypt from "bcrypt";

// Mock bcrypt
jest.mock("bcrypt");
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("UsersService", () => {
  let service: UsersService;
  let userRepository: jest.Mocked<IUserRepository>;

  const mockUser: User = {
    id: "1",
    email: "test@example.com",
    role: Role.Vendeur,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
  };

  const mockCreateUserDto: CreateUserDto = {
    email: "new@example.com",
    password: "password123",
    role: Role.Magasinier,
  };

  beforeEach(async () => {
    const mockUserRepository: Partial<jest.Mocked<IUserRepository>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: IUserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(IUserRepository);

    // Reset mocks
    jest.clearAllMocks();
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword123");
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new user successfully", async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);

      // Act
      const result = await service.create(mockCreateUserDto);

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        mockCreateUserDto.email,
      );
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        mockCreateUserDto.password,
        10,
      );
      expect(userRepository.create).toHaveBeenCalledWith({
        email: mockCreateUserDto.email,
        passwordHash: "hashedPassword123",
        role: mockCreateUserDto.role,
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw ConflictException if user with email already exists", async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        new ConflictException(
          `Un utilisateur avec l'email ${mockCreateUserDto.email} existe déjà`,
        ),
      );
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        mockCreateUserDto.email,
      );
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it("should handle bcrypt hashing correctly", async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);

      // Act
      await service.create(mockCreateUserDto);

      // Assert
      expect(mockedBcrypt.hash).toHaveBeenCalledWith("password123", 10);
    });
  });

  describe("findAll", () => {
    it("should return all users", async () => {
      // Arrange
      const mockUsers = [
        mockUser,
        { ...mockUser, id: "2", email: "user2@example.com" },
      ];
      userRepository.findAll.mockResolvedValue(mockUsers);

      // Act
      const result = await service.findAll();

      // Assert
      expect(userRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it("should return empty array when no users exist", async () => {
      // Arrange
      userRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("should return user when found", async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne("1");

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockUser);
    });

    it("should throw NotFoundException when user not found", async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne("999")).rejects.toThrow(
        new NotFoundException(`Utilisateur avec l'ID 999 non trouvé`),
      );
      expect(userRepository.findById).toHaveBeenCalledWith("999");
    });
  });

  describe("findByEmail", () => {
    it("should return user when found by email", async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail("test@example.com");

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found by email", async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await service.findByEmail("notfound@example.com");

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        "notfound@example.com",
      );
      expect(result).toBeNull();
    });
  });

  describe("remove", () => {
    it("should remove user successfully", async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.delete.mockResolvedValue(undefined);

      // Act
      await service.remove("1");

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith("1");
      expect(userRepository.delete).toHaveBeenCalledWith("1");
    });

    it("should throw NotFoundException when trying to remove non-existent user", async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove("999")).rejects.toThrow(
        new NotFoundException(`Utilisateur avec l'ID 999 non trouvé`),
      );
      expect(userRepository.findById).toHaveBeenCalledWith("999");
      expect(userRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("getUserStats", () => {
    it("should return user statistics correctly", async () => {
      // Arrange
      const mockUsers = [
        { ...mockUser, role: Role.SuperAdmin },
        { ...mockUser, id: "2", role: Role.Magasinier },
        { ...mockUser, id: "3", role: Role.Vendeur },
        { ...mockUser, id: "4", role: Role.Vendeur },
      ];
      userRepository.findAll.mockResolvedValue(mockUsers);

      // Act
      const result = await service.getUserStats();

      // Assert
      expect(userRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        total: 4,
        byRole: {
          [Role.SuperAdmin]: 1,
          [Role.Magasinier]: 1,
          [Role.Vendeur]: 2,
        },
      });
    });

    it("should return empty stats when no users exist", async () => {
      // Arrange
      userRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await service.getUserStats();

      // Assert
      expect(result).toEqual({
        total: 0,
        byRole: {},
      });
    });

    it("should handle single user stats correctly", async () => {
      // Arrange
      const mockUsers = [mockUser];
      userRepository.findAll.mockResolvedValue(mockUsers);

      // Act
      const result = await service.getUserStats();

      // Assert
      expect(result).toEqual({
        total: 1,
        byRole: {
          [Role.Vendeur]: 1,
        },
      });
    });
  });
});
