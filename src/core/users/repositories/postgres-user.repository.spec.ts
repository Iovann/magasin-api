import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { PostgresUserRepository } from "./postgres-user.repository";
import { PostgresUser } from "../entities/postgres-user.entity";
import { User } from "../entities/user.entity";
import { Role } from "../../../common/enum/role.enum";

describe("PostgresUserRepository", () => {
  let repository: PostgresUserRepository;
  let mockUserRepository: jest.Mocked<Repository<PostgresUser>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<PostgresUser>>;

  const mockUser: User = {
    id: "1",
    email: "test@example.com",
    role: Role.Vendeur,
    isBlocked: false,
    createdAt: new Date(),
  };

  const mockPostgresUser: PostgresUser = {
    id: "1",
    email: "test@example.com",
    role: Role.Vendeur,
    isBlocked: false,
    createdAt: new Date(),
    passwordHash: "hashedPassword123",
  };

  const mockUserWithPassword = {
    ...mockUser,
    passwordHash: "hashedPassword123",
  };

  // const createUserData = {
  //   email: 'new@example.com',
  //   role: 'USER',
  //   isBlocked: false,
  // };

  beforeEach(async () => {
    mockQueryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    } as any;

    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostgresUserRepository,
        {
          provide: getRepositoryToken(PostgresUser),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<PostgresUserRepository>(PostgresUserRepository);
    mockUserRepository = module.get(getRepositoryToken(PostgresUser));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const createUserData = {
        email: "test@example.com",
        passwordHash: "hashedPassword123",
        role: Role.Vendeur,
        isBlocked: false,
      };

      mockUserRepository.create.mockReturnValue(mockPostgresUser);
      mockUserRepository.save.mockResolvedValue(mockPostgresUser);

      const result = await repository.create(createUserData);

      expect(mockUserRepository.create).toHaveBeenCalledWith(createUserData);
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockPostgresUser);
      expect(result).toMatchObject({
        id: "1",
        email: "test@example.com",
        role: Role.Vendeur,
        isBlocked: false,
      });
    });
  });

  describe("findById", () => {
    it("should find a user by id", async () => {
      mockUserRepository.findOneBy.mockResolvedValue(mockPostgresUser);

      const result = await repository.findById("1");

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: "1" });
      expect(result).toMatchObject({
        id: "1",
        email: "test@example.com",
        role: Role.Vendeur,
        isBlocked: false,
      });
    });

    it("should return null when user not found", async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      const result = await repository.findById("999");

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: "999" });
      expect(result).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should find a user by email", async () => {
      mockUserRepository.findOneBy.mockResolvedValue(mockPostgresUser);

      const result = await repository.findByEmail("test@example.com");

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({
        email: "test@example.com",
      });
      expect(result).toMatchObject({
        id: "1",
        email: "test@example.com",
        role: Role.Vendeur,
        isBlocked: false,
      });
    });

    it("should return null when user not found by email", async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      const result = await repository.findByEmail("nonexistent@example.com");

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({
        email: "nonexistent@example.com",
      });
      expect(result).toBeNull();
    });
  });

  describe("findByEmailWithPassword", () => {
    it("should find a user by email with password hash", async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockUserWithPassword);

      const result =
        await repository.findByEmailWithPassword("test@example.com");

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledWith(
        "user",
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "user.passwordHash",
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "user.email = :email",
        { email: "test@example.com" },
      );
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(result).toEqual(mockUserWithPassword);
    });

    it("should return null when user not found by email with password", async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await repository.findByEmailWithPassword(
        "nonexistent@example.com",
      );

      expect(result).toBeNull();
    });
  });

  describe("findByIdWithPassword", () => {
    it("should find a user by id with password hash", async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockUserWithPassword);

      const result = await repository.findByIdWithPassword("1");

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledWith(
        "user",
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "user.passwordHash",
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith("user.id = :id", {
        id: "1",
      });
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(result).toEqual(mockUserWithPassword);
    });

    it("should return null when user not found by id with password", async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await repository.findByIdWithPassword("999");

      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should return all users", async () => {
      mockUserRepository.find.mockResolvedValue([mockPostgresUser]);

      const result = await repository.findAll();

      expect(mockUserRepository.find).toHaveBeenCalled();
      expect(result).toMatchObject([
        {
          id: "1",
          email: "test@example.com",
          role: Role.Vendeur,
          isBlocked: false,
        },
      ]);
    });
  });

  describe("update", () => {
    it("should update an existing user", async () => {
      const updateData = { isBlocked: true };
      const updatedUser = { ...mockUser, isBlocked: true };

      mockUserRepository.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });
      mockUserRepository.findOneBy.mockResolvedValue(updatedUser);

      const result = await repository.update("1", updateData);

      expect(mockUserRepository.update).toHaveBeenCalledWith("1", updateData);
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: "1" });
      expect(result).toEqual(updatedUser);
    });

    it("should return null when user not found for update", async () => {
      const updateData = { isBlocked: true };

      mockUserRepository.update.mockResolvedValue({
        affected: 0,
        raw: [],
        generatedMaps: [],
      });
      mockUserRepository.findOneBy.mockResolvedValue(null);

      const result = await repository.update("999", updateData);

      expect(mockUserRepository.update).toHaveBeenCalledWith("999", {
        isBlocked: true,
      });
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: "999" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete a user", async () => {
      mockUserRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      await repository.delete("1");

      expect(mockUserRepository.delete).toHaveBeenCalledWith("1");
    });
  });
});
