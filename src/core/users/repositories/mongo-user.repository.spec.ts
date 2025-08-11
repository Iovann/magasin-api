import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { Model, Query, ClientSession } from "mongoose";
import { MongoUserRepository } from "./mongo-user.repository";
import { MongoUser } from "../entities/mongo-user.entity";
import { User } from "../entities/user.entity";
import { Role } from "../../../common/enum/role.enum";

const baseUser: User = {
  id: "507f1f77bcf86cd799439011",
  email: "test@example.com",
  role: Role.Vendeur,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
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
});

// Mock for the Mongoose session
const mockSession = {
  withTransaction: jest.fn(),
  endSession: jest.fn(),
} as unknown as ClientSession;

describe("MongoUserRepository", () => {
  let repository: MongoUserRepository;
  let userModel: any; // Using 'any' to accommodate the mock

  // Mock query chain
  const mockQuery = {
    session: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    select: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoUserRepository,
        {
          provide: getModelToken(MongoUser.name),
          useValue: jest.fn().mockImplementation((data) => ({
            ...data,
            save: jest.fn().mockResolvedValue(mockUserDoc({ ...data, id: "new-id" })),
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

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("create", () => {
    it("should create a user with a session", async () => {
      const saveMock = jest
        .fn()
        .mockResolvedValue(mockUserDoc({ ...createUserData, id: "new-id" }));
      userModel.mockImplementation((data: any) => ({
        ...data,
        save: saveMock,
      }));

      const result = await repository.create(createUserData, mockSession);

      expect(userModel).toHaveBeenCalledWith(createUserData);
      expect(saveMock).toHaveBeenCalledWith({ session: mockSession });
      expect(result.email).toBe(createUserData.email);
    });
  });

  describe("findById", () => {
    it("should find a user by ID with a session", async () => {
      mockQuery.exec.mockResolvedValue(mockUserDoc(baseUser));

      const result = await repository.findById(baseUser.id, mockSession);

      expect(userModel.findById).toHaveBeenCalledWith(baseUser.id);
      expect(mockQuery.session).toHaveBeenCalledWith(mockSession);
      expect(result).toEqual(baseUser);
    });
  });

  describe("findByEmail", () => {
    it("should find a user by email with a session", async () => {
      mockQuery.exec.mockResolvedValue(mockUserDoc(baseUser));

      const result = await repository.findByEmail(baseUser.email, mockSession);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: baseUser.email });
      expect(mockQuery.session).toHaveBeenCalledWith(mockSession);
      expect(result).toEqual(baseUser);
    });
  });

  describe("findAll", () => {
    it("should find all users with a session", async () => {
      mockQuery.exec.mockResolvedValue([mockUserDoc(baseUser)]);

      const result = await repository.findAll(mockSession);

      expect(userModel.find).toHaveBeenCalled();
      expect(mockQuery.session).toHaveBeenCalledWith(mockSession);
      expect(result).toEqual([baseUser]);
    });
  });

  describe("delete", () => {
    it("should delete a user with a session", async () => {
      mockQuery.exec.mockResolvedValue({});

      await repository.delete(baseUser.id, mockSession);

      expect(userModel.findByIdAndDelete).toHaveBeenCalledWith(baseUser.id);
      expect(mockQuery.session).toHaveBeenCalledWith(mockSession);
    });
  });

  describe("findByEmailWithPassword", () => {
    it("should return user with passwordHash without a session", async () => {
      const userWithHash = { ...baseUser, passwordHash: "hashed" };
      mockQuery.exec.mockResolvedValue(mockUserDoc(userWithHash));

      const result = await repository.findByEmailWithPassword(baseUser.email);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: baseUser.email });
      expect(mockQuery.select).toHaveBeenCalledWith("+passwordHash");
      expect(result).toEqual(userWithHash);
    });
  });
});