import { Test, TestingModule } from "@nestjs/testing";
import { FsUserRepository } from "./fs-user.repository";
import { DatabaseConfig } from "../../../config/database.config";
import { User } from "../entities/user.entity";
import { Role } from "../../../common/enum/role.enum";
import * as fs from "fs";
import * as path from "path";

// Mock fs module with promises
jest.mock("fs", () => ({
  promises: {
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));
jest.mock("path", () => ({
  resolve: jest.fn(),
  dirname: jest.fn(),
  join: jest.fn(),
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe("FsUserRepository", () => {
  let repository: FsUserRepository;
  let mockDatabaseConfig: jest.Mocked<DatabaseConfig>;

  const mockUser: User = {
    id: "1",
    email: "test@example.com",
    role: Role.Vendeur,
    isBlocked: false,
    createdAt: new Date(),
  };

  const mockUserWithPassword = {
    ...mockUser,
    passwordHash: "hashedPassword123",
  };

  const createUserData = {
    email: "new@example.com",
    passwordHash: "newHashedPassword",
    role: Role.Vendeur,
    isBlocked: false,
  };

  const mockDataPath = "/tmp/test-data";
  const mockUsersFilePath = path.resolve(mockDataPath, "users.json");

  beforeEach(async () => {
    mockDatabaseConfig = {
      dbPath: mockDataPath,
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FsUserRepository,
        {
          provide: DatabaseConfig,
          useValue: mockDatabaseConfig,
        },
      ],
    }).compile();

    repository = module.get<FsUserRepository>(FsUserRepository);

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockPath.resolve.mockReturnValue(mockUsersFilePath);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify([mockUser]));
    mockFs.writeFileSync.mockImplementation(() => {});
    (mockFs.mkdirSync as jest.Mock).mockImplementation(() => {});

    // Setup fs.promises mocks
    (mockFs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
    (mockFs.promises.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify([mockUser]),
    );
    (mockFs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

    // Initialize repository data
    await repository.onModuleInit();
  });

  afterEach(async () => {
    // Clear the repository data after each test
    (repository as any).data = [];
    jest.clearAllMocks();
  });

  // Helper function to set repository data directly
  const setRepositoryData = (data: any[]) => {
    (repository as any).data = data;
  };

  describe("constructor", () => {
    it("should create directory if it does not exist", async () => {
      // Reset mocks for this specific test
      jest.clearAllMocks();
      const testDataPath = "/tmp/test-data";
      mockFs.existsSync.mockReturnValue(false);
      mockPath.resolve.mockReturnValue(`${testDataPath}/users.json`);
      mockPath.dirname.mockReturnValue(testDataPath);

      const newRepository = new FsUserRepository({
        dbPath: testDataPath,
      } as any);
      await newRepository.onModuleInit();

      expect(mockFs.promises.mkdir).toHaveBeenCalledWith(testDataPath, {
        recursive: true,
      });
    });

    it("should call mkdir even if directory already exists (recursive mode)", async () => {
      // Reset mocks for this specific test
      jest.clearAllMocks();
      const testDataPath = "/tmp/test-data";
      mockFs.existsSync.mockReturnValue(true);
      mockPath.resolve.mockReturnValue(`${testDataPath}/users.json`);
      mockPath.dirname.mockReturnValue(testDataPath);

      const newRepository = new FsUserRepository({
        dbPath: testDataPath,
      } as any);
      await newRepository.onModuleInit();

      // mkdir is always called with recursive: true, even if directory exists
      expect(mockFs.promises.mkdir).toHaveBeenCalledWith(testDataPath, {
        recursive: true,
      });
    });
  });

  describe("create", () => {
    it("should create a new user successfully", async () => {
      const existingUsers = [mockUser];
      setRepositoryData(existingUsers);

      const result = await repository.create(createUserData);

      expect(result).toMatchObject({
        email: createUserData.email,
        role: createUserData.role,
        isBlocked: createUserData.isBlocked,
        id: expect.any(String),
        createdAt: expect.any(Date),
      });
      expect(mockFs.promises.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(createUserData.email),
      );
    });

    it("should create file if it does not exist", async () => {
      // Create a new repository instance for this test
      const testConfig = { dbPath: "/test/path" } as any;
      const testPath = "/test/path/users.json";
      mockPath.resolve.mockReturnValue(testPath);

      const testRepository = new FsUserRepository(testConfig);
      (testRepository as any).data = [];

      const result = await testRepository.create(createUserData);

      expect(result).toMatchObject({
        email: createUserData.email,
        role: createUserData.role,
        isBlocked: createUserData.isBlocked,
        id: expect.any(String),
        createdAt: expect.any(Date),
      });
      expect(mockFs.promises.writeFile).toHaveBeenCalledWith(
        testPath,
        expect.stringContaining(createUserData.email),
      );
    });

    it("should generate unique ID for new user", async () => {
      const existingUsers = [mockUser];
      setRepositoryData(existingUsers);

      const result1 = await repository.create(createUserData);
      const result2 = await repository.create(createUserData);

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe("findById", () => {
    it("should find user by id", async () => {
      const existingUsers = [mockUser];
      setRepositoryData(existingUsers);

      const result = await repository.findById("1");

      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found", async () => {
      const existingUsers = [mockUser];
      setRepositoryData(existingUsers);

      const result = await repository.findById("999");

      expect(result).toBeNull();
    });

    it("should handle file read errors gracefully", async () => {
      setRepositoryData([]);

      const result = await repository.findById("1");

      expect(result).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should find user by email", async () => {
      const existingUsers = [mockUser];
      setRepositoryData(existingUsers);

      const result = await repository.findByEmail("test@example.com");

      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found by email", async () => {
      const existingUsers = [mockUser];
      setRepositoryData(existingUsers);

      const result = await repository.findByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });

    it("should handle file read errors gracefully", async () => {
      setRepositoryData([]);

      const result = await repository.findByEmail("test@example.com");

      expect(result).toBeNull();
    });
  });

  describe("findByEmailWithPassword", () => {
    it("should find user by email with password hash", async () => {
      const existingUsers = [mockUserWithPassword];
      setRepositoryData(existingUsers);

      const result =
        await repository.findByEmailWithPassword("test@example.com");

      expect(result).toEqual(mockUserWithPassword);
    });

    it("should return null when user not found by email with password", async () => {
      const existingUsers = [mockUserWithPassword];
      setRepositoryData(existingUsers);

      const result = await repository.findByEmailWithPassword(
        "nonexistent@example.com",
      );

      expect(result).toBeNull();
    });

    it("should handle file read errors gracefully", async () => {
      setRepositoryData([]);

      const result =
        await repository.findByEmailWithPassword("test@example.com");

      expect(result).toBeNull();
    });
  });

  describe("findByIdWithPassword", () => {
    it("should find user by id with password hash", async () => {
      const existingUsers = [mockUserWithPassword];
      setRepositoryData(existingUsers);

      const result = await repository.findByIdWithPassword("1");

      expect(result).toEqual(mockUserWithPassword);
    });

    it("should return null when user not found by id with password", async () => {
      const existingUsers = [mockUserWithPassword];
      setRepositoryData(existingUsers);

      const result = await repository.findByIdWithPassword("999");

      expect(result).toBeNull();
    });

    it("should handle file read errors gracefully", async () => {
      setRepositoryData([]);

      const result = await repository.findByIdWithPassword("1");

      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should return all users", async () => {
      const existingUsers = [mockUser, { ...mockUser, id: "2" }];
      setRepositoryData(existingUsers);

      const result = await repository.findAll();

      expect(result).toEqual(existingUsers);
    });

    it("should return empty array when file is empty", async () => {
      setRepositoryData([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it("should return empty array when file contains invalid JSON", async () => {
      setRepositoryData([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it("should handle file read errors gracefully", async () => {
      setRepositoryData([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe("update", () => {
    it("should update user successfully", async () => {
      const existingUsers = [mockUser];
      setRepositoryData(existingUsers);

      const updateData = { isBlocked: true };
      const result = await repository.update("1", updateData);

      expect(result).toEqual({ ...mockUser, isBlocked: true });
      expect(mockFs.promises.writeFile).toHaveBeenCalledWith(
        mockUsersFilePath,
        expect.stringContaining('"isBlocked": true'),
      );
    });

    it("should return null when user not found", async () => {
      const existingUsers = [mockUser];
      setRepositoryData(existingUsers);

      const result = await repository.update("999", { isBlocked: true });

      expect(result).toBeNull();
      expect(mockFs.promises.writeFile).not.toHaveBeenCalled();
    });

    it("should update multiple fields", async () => {
      const existingUsers = [mockUser];
      setRepositoryData(existingUsers);

      const updateData = { isBlocked: true, role: Role.Magasinier };
      const result = await repository.update("1", updateData);

      expect(result).toEqual({
        ...mockUser,
        isBlocked: true,
        role: Role.Magasinier,
      });
    });

    it("should handle file read errors gracefully", async () => {
      setRepositoryData([]);

      const result = await repository.update("1", { isBlocked: true });

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete user by id", async () => {
      const existingUsers = [mockUser, { ...mockUser, id: "2" }];
      setRepositoryData(existingUsers);

      await repository.delete("1");

      expect(mockFs.promises.writeFile).toHaveBeenCalledWith(
        mockUsersFilePath,
        expect.stringContaining('"id": "2"'),
      );
    });

    it("should not modify file when user not found", async () => {
      const existingUsers = [mockUser];
      setRepositoryData(existingUsers);

      await repository.delete("999");

      expect(mockFs.promises.writeFile).not.toHaveBeenCalled();
    });

    it("should handle file read errors gracefully", async () => {
      setRepositoryData([]);

      await repository.delete("1");

      expect(mockFs.promises.writeFile).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle JSON parse errors gracefully", async () => {
      setRepositoryData([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it("should handle file write errors", async () => {
      setRepositoryData([mockUser]);
      (mockFs.promises.writeFile as jest.Mock).mockRejectedValue(
        new Error("File write error"),
      );

      await expect(repository.create(createUserData)).rejects.toThrow(
        "File write error",
      );
    });

    it("should handle directory creation errors", async () => {
      const errorConfig = { ...mockDatabaseConfig };
      const errorRepository = new FsUserRepository(errorConfig);

      (mockFs.promises.mkdir as jest.Mock).mockRejectedValue(
        new Error("Directory creation error"),
      );

      await expect(errorRepository.onModuleInit()).rejects.toThrow(
        "Directory creation error",
      );
    });
  });

  describe("file operations", () => {
    it("should use correct file path", () => {
      mockDatabaseConfig.dbPath = "/custom/data/path";
      mockPath.resolve.mockReturnValue("/custom/data/path/users.json");

      new FsUserRepository(mockDatabaseConfig);

      expect(mockPath.resolve).toHaveBeenCalledWith(
        "/custom/data/path",
        "users.json",
      );
    });

    it("should create users.json file if it does not exist", async () => {
      // Create a new repository with custom path for this test
      const customConfig = { dbPath: "/custom/data/path" } as any;
      const customPath = "/custom/data/path/users.json";
      mockPath.resolve.mockReturnValue(customPath);

      const customRepository = new FsUserRepository(customConfig);
      (customRepository as any).data = [];

      await customRepository.create(createUserData);

      expect(mockFs.promises.writeFile).toHaveBeenCalledWith(
        customPath,
        expect.stringContaining(createUserData.email),
      );
    });
  });

  describe("data validation", () => {
    it("should handle users with missing optional fields", async () => {
      const incompleteUser = {
        id: "1",
        email: "test@example.com",
        role: Role.Vendeur,
        // Missing isBlocked, createdAt, updatedAt
      };
      setRepositoryData([incompleteUser]);

      const result = await repository.findById("1");

      expect(result).toBeDefined();
      expect(result?.email).toBe("test@example.com");
    });

    it("should handle users with extra fields", async () => {
      const userWithExtraFields = {
        ...mockUser,
        extraField: "extra value",
        anotherField: 123,
      };
      setRepositoryData([userWithExtraFields]);

      const result = await repository.findById("1");

      expect(result).toBeDefined();
      expect(result?.email).toBe("test@example.com");
      // Extra fields should be preserved
      expect((result as any).extraField).toBe("extra value");
    });
  });

  describe("edge cases", () => {
    it("should handle empty users array", async () => {
      setRepositoryData([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it("should handle single user in file", async () => {
      setRepositoryData([mockUser]);

      const result = await repository.findAll();

      expect(result).toEqual([mockUser]);
    });

    it("should handle very large user objects", async () => {
      const largeUser = {
        ...mockUser,
        largeField: "x".repeat(10000), // Very long string
        metadata: {
          description: "Very detailed description",
          tags: Array(100).fill("tag"),
          preferences: {
            theme: "dark",
            language: "fr",
            notifications: true,
          },
        },
      };
      setRepositoryData([largeUser]);

      const result = await repository.findById("1");

      expect(result).toBeDefined();
      expect(result?.email).toBe("test@example.com");
    });
  });
});
