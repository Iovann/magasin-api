import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MongoUserRepository } from "./mongo-user.repository";
import { MongoUser } from "../entities/mongo-user.entity";
import { User } from "../entities/user.entity";
import { Role } from "../../../common/enum/role.enum";

const baseUser: User = {
  id: "507f1f77bcf86cd799439011",
  email: "test@example.com",
  role: Role.Vendeur,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  isBlocked: false,
};

const createUserData = {
  email: "new@example.com",
  passwordHash: "hashedPassword456",
  role: Role.Magasinier,
};

const mockUserDoc = (user: Partial<User & { passwordHash?: string }>) => ({
  ...user,
  id: user.id || "mock-id",
  _id: user.id || "mock-id",
  email: user.email,
  role: user.role,
  createdAt: user.createdAt || new Date(),
  passwordHash: user.passwordHash,
  isBlocked: user.isBlocked || false,
});

describe("MongoUserRepository", () => {
  let repository: MongoUserRepository;
  let userModel: any; // Using 'any' to accommodate the mock

  // Mock query chain
  const mockQuery = {
    session: jest.fn().mockReturnThis(), // This can be removed if no session is used anywhere
    exec: jest.fn(),
    select: jest.fn().mockReturnThis(),
  };

  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        MongoUserRepository,
        {
          provide: getModelToken(MongoUser.name),
          useValue: jest.fn().mockImplementation((data) => ({
            ...data,
            save: jest
              .fn()
              .mockResolvedValue(mockUserDoc({ ...data, id: "new-id" })),
          })),
        },
      ],
    }).compile();

    repository = module.get<MongoUserRepository>(MongoUserRepository);
    userModel = module.get<Model<MongoUser>>(getModelToken(MongoUser.name));

    // Attach static method mocks
    userModel.findById = jest.fn().mockReturnValue(mockQuery);
    userModel.findOne = jest.fn().mockReturnValue(mockQuery);
    userModel.find = jest.fn().mockReturnValue(mockQuery);
    userModel.findByIdAndDelete = jest.fn().mockReturnValue(mockQuery);
  });

  afterEach(() => {
    module.close();
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("create", () => {
    it("should create a user", async () => {
      const saveMock = jest
        .fn()
        .mockResolvedValue(mockUserDoc({ ...createUserData, id: "new-id" }));
      userModel.mockImplementation((data: any) => ({
        ...data,
        save: saveMock,
      }));

      const result = await repository.create(createUserData);

      expect(userModel).toHaveBeenCalledWith(createUserData);
      expect(saveMock).toHaveBeenCalledWith(); // No session argument
      expect(result.email).toBe(createUserData.email);
    });
  });

  describe("findById", () => {
    it("should find a user by ID", async () => {
      mockQuery.exec.mockResolvedValue(mockUserDoc(baseUser));

      const result = await repository.findById(baseUser.id);

      expect(userModel.findById).toHaveBeenCalledWith(baseUser.id);
      expect(mockQuery.session).not.toHaveBeenCalled(); // No session argument
      expect(result).toEqual(expect.objectContaining(baseUser));
    });
  });

  describe("findByEmail", () => {
    it("should find a user by email", async () => {
      mockQuery.exec.mockResolvedValue(mockUserDoc(baseUser));

      const result = await repository.findByEmail(baseUser.email);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: baseUser.email });
      expect(mockQuery.session).not.toHaveBeenCalled(); // No session argument
      expect(result).toEqual(expect.objectContaining(baseUser));
    });
  });

  describe("findAll", () => {
    it("should find all users", async () => {
      mockQuery.exec.mockResolvedValue([mockUserDoc(baseUser)]);

      const result = await repository.findAll();

      expect(userModel.find).toHaveBeenCalled();
      expect(mockQuery.session).not.toHaveBeenCalled(); // No session argument
      expect(result).toEqual([expect.objectContaining(baseUser)]);
    });
  });

  describe("delete", () => {
    it("should delete a user", async () => {
      mockQuery.exec.mockResolvedValue({});

      await repository.delete(baseUser.id);

      expect(userModel.findByIdAndDelete).toHaveBeenCalledWith(baseUser.id);
      expect(mockQuery.session).not.toHaveBeenCalled(); // No session argument
    });
  });

  describe("findByEmailWithPassword", () => {
    it("should return user with passwordHash without a session", async () => {
      const userWithHash = { ...baseUser, passwordHash: "hashed" };
      mockQuery.exec.mockResolvedValue(mockUserDoc(userWithHash));

      const result = await repository.findByEmailWithPassword(baseUser.email);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: baseUser.email });
      expect(mockQuery.select).toHaveBeenCalledWith("+passwordHash");
      expect(result).toEqual(expect.objectContaining(userWithHash));
    });
  });

  describe("findByIdWithPassword", () => {
    it("should return user with passwordHash by ID", async () => {
      const userWithHash = { ...baseUser, passwordHash: "hashed" };
      mockQuery.exec.mockResolvedValue(mockUserDoc(userWithHash));

      const result = await repository.findByIdWithPassword(baseUser.id);

      expect(userModel.findById).toHaveBeenCalledWith(baseUser.id);
      expect(mockQuery.select).toHaveBeenCalledWith("+passwordHash");
      expect(result).toEqual(expect.objectContaining(userWithHash));
    });

    it("should return null if user not found by ID", async () => {
      mockQuery.exec.mockResolvedValue(null);

      const result = await repository.findByIdWithPassword("non-existent-id");

      expect(userModel.findById).toHaveBeenCalledWith("non-existent-id");
      expect(mockQuery.select).toHaveBeenCalledWith("+passwordHash");
      expect(result).toBeNull();
    });
  });
});
