import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { Model, Query } from "mongoose";
import { MongoUserRepository } from "./mongo-user.repository";
import { MongoUser } from "../entities/mongo-user.entity";
import { User } from "../entities/user.entity";
import { Role } from "../../../common/enum/role.enum";

// Mock de base pour un utilisateur
const baseUser: User = {
  id: "507f1f77bcf86cd799439011",
  email: "test@example.com",
  role: Role.Vendeur,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
};

// Mock pour les données de création
const createUserData = {
  email: "new@example.com",
  passwordHash: "hashedPassword456",
  role: Role.Magasinier,
};

// Mock du document retourné par Mongoose
const mockUserDoc = (user: Partial<User & { passwordHash?: string }>) => ({
  ...user,
  id: user.id || "mock-id",
  _id: user.id || "mock-id",
  email: user.email,
  role: user.role,
  createdAt: user.createdAt || new Date(),
  passwordHash: user.passwordHash,
  toObject: () => mockUserDoc(user), // Ajout de la méthode toObject
});

describe("MongoUserRepository", () => {
  let repository: MongoUserRepository;
  let userModel: any; // Le type est 'any' pour accommoder le mock

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoUserRepository,
        {
          provide: getModelToken(MongoUser.name),
          // On simule le constructeur du modèle et ses méthodes statiques
          useValue: jest.fn().mockImplementation((data) => ({
            ...data,
            save: jest
              .fn()
              .mockResolvedValue(mockUserDoc({ ...data, id: "new-id" })),
            toObject: () => data, // Ajout de la méthode toObject
          })),
        },
      ],
    }).compile();

    repository = module.get<MongoUserRepository>(MongoUserRepository);
    userModel = module.get<Model<MongoUser>>(getModelToken(MongoUser.name));

    // On attache les mocks des méthodes statiques au constructeur simulé
    userModel.findById = jest.fn();
    userModel.findOne = jest.fn();
    userModel.find = jest.fn();
    userModel.findByIdAndDelete = jest.fn();
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("create", () => {
    it("should create a new user and return the user entity", async () => {
      const result = await repository.create(createUserData);

      // On vérifie que le constructeur a été appelé
      expect(userModel).toHaveBeenCalledWith(createUserData);
      // On vérifie que le résultat est conforme à l'entité User
      expect(result.email).toBe(createUserData.email);
      expect(result.id).toBe("new-id");
    });
  });

  describe("findById", () => {
    it("should find a user by ID and return the user entity", async () => {
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserDoc(baseUser)),
      } as unknown as Query<any, any>);

      const result = await repository.findById(baseUser.id);

      expect(userModel.findById).toHaveBeenCalledWith(baseUser.id);
      expect(result).toEqual(baseUser);
    });

    it("should return null if user is not found", async () => {
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as unknown as Query<any, any>);

      const result = await repository.findById("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should find a user by email", async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserDoc(baseUser)),
      } as unknown as Query<any, any>);

      const result = await repository.findByEmail(baseUser.email);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: baseUser.email });
      expect(result).toEqual(baseUser);
    });
  });

  describe("findAll", () => {
    it("should return an array of users", async () => {
      userModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockUserDoc(baseUser)]),
      } as unknown as Query<any, any>);

      const result = await repository.findAll();

      expect(result).toEqual([baseUser]);
    });
  });

  describe("delete", () => {
    it("should call findByIdAndDelete with the correct ID", async () => {
      userModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      } as unknown as Query<any, any>);

      await repository.delete(baseUser.id);

      expect(userModel.findByIdAndDelete).toHaveBeenCalledWith(baseUser.id);
    });
  });

  describe("findByEmailWithPassword", () => {
    it("should return user with passwordHash", async () => {
      const userWithHash = { ...baseUser, passwordHash: "hashed" };
      userModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUserDoc(userWithHash)),
      } as any);

      const result = await repository.findByEmailWithPassword(baseUser.email);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: baseUser.email });
      expect(result).toEqual(userWithHash);
    });

    it("should return null if user is not found", async () => {
      userModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await repository.findByEmailWithPassword("non-existent");

      expect(result).toBeNull();
    });
  });
});
