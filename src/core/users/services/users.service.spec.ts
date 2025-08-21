import { getQueueToken } from "@nestjs/bullmq";
import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { IUserRepository } from "../repositories/user.repository";
import { ErrorHandlingService } from "../../../common/response/error-handling";
import { CreateUserDto } from "../dto/create-user.dto";
import { User } from "../entities/user.entity";
import { Logger } from "winston";
import {
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import * as bcrypt from "bcrypt";
import { Role } from "../../../common/enum/role.enum";
import { CacheService } from "../../../libs/cache/cache.service";
import { EncryptionService } from "../../../helpers/encryption/encryption.service";

// Mock bcrypt
jest.mock("bcrypt");
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("UsersService", () => {
  let service: UsersService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockErrorHandlingService: jest.Mocked<ErrorHandlingService>;
  let mockLogger: jest.Mocked<Logger>;
  let mockEncryptionService: jest.Mocked<EncryptionService>;

  const mockUser: User = {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    email: "test@example.com",
    role: Role.Vendeur,
    isBlocked: false,
    createdAt: new Date(),
  };

  const mockUserWithPassword = {
    ...mockUser,
    passwordHash: "hashedPassword123",
  };

  const createUserDto: CreateUserDto = {
    firstName: "John",
    lastName: "Doe",
    email: "new@example.com",
    role: Role.Vendeur,
  };

  // const createUserData = {
  //   email: 'new@example.com',
  //   passwordHash: 'newHashedPassword',
  //   role: Role.Vendeur,
  //   isBlocked: false,
  // };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findByIdWithPassword: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockErrorService = {
      returnErrorOnConflict: jest.fn(),
      returnErrorOnInternalServerError: jest.fn(),
      returnErrorOnNotFound: jest.fn(),
    };

    const mockWinstonLogger: jest.Mocked<Logger> = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      verbose: jest.fn(),
      silly: jest.fn(),
      child: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Logger>;

    const mockCache = {
      get: jest.fn().mockResolvedValue(undefined), // Ensure cache miss to trigger repository calls
      set: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
      wrap: jest.fn(),
      getOrSet: jest
        .fn()
        .mockImplementation(async (key: string, fn: () => Promise<any>) => {
          // Simulate cache miss - execute the function directly
          return await fn();
        }),
    };

    const mockEncryptionServiceObject = {
      generateStrongPassword: jest.fn(),
    };

    const mockEmailQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: IUserRepository,
          useValue: mockRepository,
        },
        {
          provide: ErrorHandlingService,
          useValue: mockErrorService,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockWinstonLogger,
        },
        {
          provide: CacheService,
          useValue: mockCache,
        },
        {
          provide: getQueueToken("email"),
          useValue: mockEmailQueue,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionServiceObject,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mockUserRepository = module.get(IUserRepository);
    mockErrorHandlingService = module.get(ErrorHandlingService);
    mockLogger = module.get(WINSTON_MODULE_PROVIDER);
    mockEncryptionService = module.get(EncryptionService);

    // Reset bcrypt mock
    mockBcrypt.hash.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new user successfully", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue("hashedPassword123" as never);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(mockEncryptionService.generateStrongPassword).toHaveBeenCalled();
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: createUserDto.role,
        isBlocked: false,
        passwordHash: "hashedPassword123",
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw conflict error when email already exists", async () => {
      const conflictError = new ConflictException(
        "A user with this email already exists",
      );
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockErrorHandlingService.returnErrorOnConflict.mockImplementation(() => {
        throw conflictError;
      });

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(
        mockErrorHandlingService.returnErrorOnConflict,
      ).toHaveBeenCalledWith(
        "[ERR_USER_CREATE_EMAIL_CONFLICT] Email new@example.com already exists",
        "A user with this email already exists",
      );
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "Failed to create user",
      );
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockRejectedValue(new Error("Database error"));
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.create(createUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_USER_CREATE_CRITICAL] Critical error: Database error",
        "Failed to create user",
      );
    });
  });

  describe("findAll", () => {
    it("should return all users successfully", async () => {
      mockUserRepository.findAll.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(mockUserRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockUser]);
      // expect(mockLogger.log).toHaveBeenCalledWith(expect.objectContaining({
      //   message: expect.stringContaining('Found 1 users'),
      //   context: UsersService.name,
      //   level: 'info'
      // }));
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while fetching all users",
      );
      mockUserRepository.findAll.mockRejectedValue(new Error("Database error"));
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_USER_FIND_ALL_CRITICAL] Error finding all users: Database error",
        "An error occurred while fetching all users",
      );
    });
  });

  describe("findOne", () => {
    it("should return user when found", async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findOne("1");

      expect(mockUserRepository.findById).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockUser);
      // expect(mockLogger.log).toHaveBeenCalledWith(expect.objectContaining({
      //   message: expect.stringContaining('Found user with ID 1'),
      //   context: UsersService.name,
      //   level: 'info'
      // }));
    });

    it("should throw not found error when user does not exist", async () => {
      const notFoundError = new NotFoundException("User not found");
      mockUserRepository.findById.mockResolvedValue(null);
      mockErrorHandlingService.returnErrorOnNotFound.mockImplementation(() => {
        throw notFoundError;
      });

      await expect(service.findOne("999")).rejects.toThrow(NotFoundException);

      expect(
        mockErrorHandlingService.returnErrorOnNotFound,
      ).toHaveBeenCalledWith(
        "[ERR_USER_FIND_ONE_NOT_FOUND] User 999 not found",
        "User not found",
      );
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while fetching the user by ID",
      );
      mockUserRepository.findById.mockRejectedValue(
        new Error("Database error"),
      );
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.findOne("1")).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_USER_FIND_ONE_CRITICAL] Error finding user by ID: Database error",
        "An error occurred while fetching the user by ID",
      );
    });

    it("should rethrow error when it has status property", async () => {
      const notFoundError = new NotFoundException("User not found");
      mockUserRepository.findById.mockRejectedValue(notFoundError);

      await expect(service.findOne("1")).rejects.toThrow(NotFoundException);

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).not.toHaveBeenCalled();
    });
  });

  describe("findByEmail", () => {
    it("should return user when found by email", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmail("test@example.com");

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(result).toEqual(mockUser);
      // expect(mockLogger.log).toHaveBeenCalledWith(expect.objectContaining({
      //   message: expect.stringContaining('Found user with email test@example.com'),
      //   context: UsersService.name,
      //   level: 'info'
      // }));
    });

    it("should return null when user not found by email", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail("nonexistent@example.com");

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        "nonexistent@example.com",
      );
      expect(result).toBeNull();
      // expect(mockLogger.log).toHaveBeenCalledWith(expect.objectContaining({
      //   message: expect.stringContaining('User with email nonexistent@example.com not found'),
      //   context: UsersService.name,
      //   level: 'info'
      // }));
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while fetching the user by email",
      );
      mockUserRepository.findByEmail.mockRejectedValue(
        new Error("Database error"),
      );
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.findByEmail("test@example.com")).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_USER_FIND_BY_EMAIL_CRITICAL] Error finding user by email: Database error",
        "An error occurred while fetching the user by email",
      );
    });
  });

  describe("findByEmailWithPassword", () => {
    it("should return user with password when found by email", async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(
        mockUserWithPassword,
      );

      const result = await service.findByEmailWithPassword("test@example.com");

      expect(mockUserRepository.findByEmailWithPassword).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(result).toEqual(mockUserWithPassword);
      // expect(mockLogger.log).toHaveBeenCalledWith(expect.objectContaining({
      //   message: expect.stringContaining('Fetching user by email with password: test@example.com'),
      //   context: UsersService.name,
      //   level: 'info'
      // }));
    });

    it("should return null when user not found by email with password", async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(null);

      const result = await service.findByEmailWithPassword(
        "nonexistent@example.com",
      );

      expect(mockUserRepository.findByEmailWithPassword).toHaveBeenCalledWith(
        "nonexistent@example.com",
      );
      expect(result).toBeNull();
      // expect(mockLogger.log).toHaveBeenCalledWith(expect.objectContaining({
      //   message: expect.stringContaining('Fetching user by email with password: nonexistent@example.com'),
      //   context: UsersService.name,
      //   level: 'info'
      // }));
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while fetching the user by email with password",
      );
      mockUserRepository.findByEmailWithPassword.mockRejectedValue(
        new Error("Database error"),
      );
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(
        service.findByEmailWithPassword("test@example.com"),
      ).rejects.toThrow(InternalServerErrorException);

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_USER_FIND_BY_EMAIL_WITH_PASSWORD_CRITICAL] Error finding user by email with password: Database error",
        "An error occurred while fetching the user by email with password",
      );
    });
  });

  describe("findByIdWithPassword", () => {
    it("should return user with password when found by id", async () => {
      mockUserRepository.findByIdWithPassword.mockResolvedValue(
        mockUserWithPassword,
      );

      const result = await service.findByIdWithPassword("1");

      expect(mockUserRepository.findByIdWithPassword).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockUserWithPassword);
      // expect(mockLogger.log).toHaveBeenCalledWith(expect.objectContaining({
      //   message: expect.stringContaining('Fetching user by ID with password: 1'),
      //   context: UsersService.name,
      //   level: 'info'
      // }));
    });

    it("should return null when user not found by id with password", async () => {
      mockUserRepository.findByIdWithPassword.mockResolvedValue(null);

      const result = await service.findByIdWithPassword("999");

      expect(mockUserRepository.findByIdWithPassword).toHaveBeenCalledWith(
        "999",
      );
      expect(result).toBeNull();
      // expect(mockLogger.log).toHaveBeenCalledWith(expect.objectContaining({
      //   message: expect.stringContaining('Fetching user by ID with password: 999'),
      //   context: UsersService.name,
      //   level: 'info'
      // }));
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while fetching the user by ID with password",
      );
      mockUserRepository.findByIdWithPassword.mockRejectedValue(
        new Error("Database error"),
      );
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.findByIdWithPassword("1")).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_USER_FIND_BY_ID_WITH_PASSWORD_CRITICAL] Error finding user by ID with password: Database error",
        "An error occurred while fetching the user by ID with password",
      );
    });
  });

  describe("update", () => {
    it("should update user successfully", async () => {
      const updateData = { isBlocked: true };
      const updatedUser = { ...mockUser, isBlocked: true };

      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update("1", updateData);

      expect(mockUserRepository.update).toHaveBeenCalledWith("1", updateData);
      expect(result).toEqual(updatedUser);
      // expect(mockLogger.log).toHaveBeenCalledWith(expect.objectContaining({
      //   message: expect.stringContaining('User 1 updated successfully'),
      //   context: UsersService.name,
      //   level: 'info'
      // }));
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while updating the user",
      );
      mockUserRepository.update.mockRejectedValue(new Error("Database error"));
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.update("1", { isBlocked: true })).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_USER_UPDATE_CRITICAL] Error updating user: Database error",
        "An error occurred while updating the user",
      );
    });
  });

  describe("remove", () => {
    it("should remove user successfully", async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.delete.mockResolvedValue(undefined);

      await service.remove("1");

      expect(mockUserRepository.findById).toHaveBeenCalledWith("1");
      expect(mockUserRepository.delete).toHaveBeenCalledWith("1");
      // expect(mockLogger.log).toHaveBeenCalledWith(expect.objectContaining({
      //   message: expect.stringContaining('User 1 removed successfully'),
      //   context: UsersService.name,
      //   level: 'info'
      // }));
    });

    it("should throw not found error when user does not exist", async () => {
      const notFoundError = new NotFoundException("User not found");
      mockUserRepository.findById.mockResolvedValue(null);
      mockErrorHandlingService.returnErrorOnNotFound.mockImplementation(() => {
        throw notFoundError;
      });

      await expect(service.remove("999")).rejects.toThrow(NotFoundException);

      expect(
        mockErrorHandlingService.returnErrorOnNotFound,
      ).toHaveBeenCalledWith(
        "[ERR_USER_REMOVE_NOT_FOUND] User 999 not found",
        "User not found",
      );
    });

    it("should throw internal server error when delete fails", async () => {
      const internalError = new InternalServerErrorException(
        "Failed to delete user",
      );
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.delete.mockRejectedValue(new Error("Delete failed"));
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.remove("1")).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_USER_REMOVE_CRITICAL] Critical error: Delete failed",
        "Failed to delete user",
      );
    });
  });

  describe("setCurrentRefreshToken", () => {
    it("should set refresh token successfully", async () => {
      const refreshToken = "new-refresh-token";
      const updatedUser = { ...mockUser, refreshToken: "hashed-token" };

      mockBcrypt.genSalt.mockResolvedValue("salt123" as never);
      mockBcrypt.hash.mockResolvedValue("hashed-token" as never);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await service.setCurrentRefreshToken(refreshToken, "1");

      expect(mockBcrypt.genSalt).toHaveBeenCalled();
      expect(mockBcrypt.hash).toHaveBeenCalledWith(refreshToken, "salt123");
      expect(mockUserRepository.update).toHaveBeenCalledWith("1", {
        refreshToken: "hashed-token",
      });
      expect(result).toEqual(updatedUser);
      // expect(mockLogger.log).toHaveBeenCalledWith(expect.objectContaining({
      //   message: expect.stringContaining(`Refresh token set for user ${mockUser.id}`),
      //   context: UsersService.name,
      //   level: 'info'
      // }));
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while setting the refresh token",
      );

      mockUserRepository.update.mockRejectedValue(new Error("Database error"));
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(
        service.setCurrentRefreshToken("token", "1"),
      ).rejects.toThrow(InternalServerErrorException);

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_USER_SET_REFRESH_TOKEN_CRITICAL] Error setting refresh token: Database error",
        "An error occurred while setting the refresh token",
      );
    });
  });

  describe("removeRefreshToken", () => {
    it("should remove refresh token successfully", async () => {
      const updatedUser = { ...mockUser, refreshToken: undefined };

      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await service.removeRefreshToken("1");

      expect(mockUserRepository.update).toHaveBeenCalledWith("1", {
        refreshToken: "",
      });
      expect(result).toEqual(updatedUser);
      // expect(mockLogger.log).toHaveBeenCalledWith(expect.objectContaining({
      //   message: expect.stringContaining(`Refresh token removed for user ${mockUser.id}`),
      //   context: UsersService.name,
      //   level: 'info'
      // }));
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while removing the refresh token",
      );

      mockUserRepository.update.mockRejectedValue(new Error("Database error"));
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.removeRefreshToken("1")).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_USER_REMOVE_REFRESH_TOKEN_CRITICAL] Error removing refresh token: Database error",
        "An error occurred while removing the refresh token",
      );
    });
  });

  describe("updatePasswordHash", () => {
    it("should update password hash successfully", async () => {
      const newPasswordHash = "new-hash";
      const updatedUser = { ...mockUser, passwordHash: newPasswordHash };

      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updatePasswordHash("1", newPasswordHash);

      expect(mockUserRepository.update).toHaveBeenCalledWith("1", {
        passwordHash: newPasswordHash,
      });
      expect(result).toEqual(updatedUser);
      // expect(mockLogger.log).toHaveBeenCalledWith(expect.objectContaining({
      //   message: expect.stringContaining(`Password hash updated for user ${mockUser.id}`),
      //   context: UsersService.name,
      //   level: 'info'
      // }));
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while updating the password hash",
      );

      mockUserRepository.update.mockRejectedValue(new Error("Database error"));
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.updatePasswordHash("1", "newHash")).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_USER_UPDATE_PASSWORD_HASH_CRITICAL] Error updating password hash: Database error",
        "An error occurred while updating the password hash",
      );
    });
  });

  describe("getUserStats", () => {
    it("should return user statistics successfully", async () => {
      const mockUsers = [
        { ...mockUser, id: "1", role: Role.Vendeur, isBlocked: false },
        { ...mockUser, id: "2", role: Role.Vendeur, isBlocked: false },
      ];

      mockUserRepository.findAll.mockResolvedValue(mockUsers);

      const result = await service.getUserStats();

      expect(mockUserRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        totalUsers: 2,
        activeUsers: 2,
        blockedUsers: 0,
        userRoles: {
          [Role.Vendeur]: 2,
        },
      });
    });

    it("should handle mixed user states correctly", async () => {
      const mockUsers = [
        { ...mockUser, id: "1", role: Role.Vendeur, isBlocked: false },
        { ...mockUser, id: "2", role: Role.Vendeur, isBlocked: false },
        { ...mockUser, id: "3", role: Role.Magasinier, isBlocked: true },
      ];

      mockUserRepository.findAll.mockResolvedValue(mockUsers);

      const result = await service.getUserStats();

      expect(result).toEqual({
        totalUsers: 3,
        activeUsers: 2,
        blockedUsers: 1,
        userRoles: {
          [Role.Vendeur]: 2,
          [Role.Magasinier]: 1,
        },
      });
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while fetching user statistics",
      );

      mockUserRepository.findAll.mockRejectedValue(new Error("Database error"));
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.getUserStats()).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_USER_GET_STATS_CRITICAL] Error getting user statistics: Database error",
        "An error occurred while fetching user statistics",
      );
    });
  });
});
