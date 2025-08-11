import { Test, TestingModule } from "@nestjs/testing";
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { IUserRepository } from "../repositories/user.repository";
import { CreateUserDto } from "../dto/create-user.dto";
import { Role } from "../../../common/enum/role.enum";
import { User } from "../entities/user.entity";
import * as bcrypt from "bcrypt";
import { ErrorHandlingService } from "../../../common/response/error-handling";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";

jest.mock("bcrypt");
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const mockUserRepository = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  delete: jest.fn(),
  constructor: { name: "" },
};

const mockErrorHandlingService = {
  returnErrorOnConflict: jest.fn((log, msg) => new ConflictException(msg)),
  returnErrorOnNotFound: jest.fn((log, msg) => new NotFoundException(msg)),
  returnErrorOnInternalServerError: jest.fn(
    (log, msg) => new InternalServerErrorException(msg),
  ),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
};

describe("UsersService", () => {
  let service: UsersService;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: IUserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: ErrorHandlingService,
          useValue: mockErrorHandlingService,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword123");
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new user successfully", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await service.create(mockCreateUserDto);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        mockCreateUserDto.email,
      );
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        mockCreateUserDto.password,
        10,
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: mockCreateUserDto.email,
        passwordHash: "hashedPassword123",
        role: mockCreateUserDto.role,
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw ConflictException if user with email already exists", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockErrorHandlingService.returnErrorOnConflict).toHaveBeenCalled();
    });

    it("should throw InternalServerErrorException on creation failure", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockRejectedValue(new Error("DB error"));

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return all users", async () => {
      const mockUsers = [
        mockUser,
        { ...mockUser, id: "2", email: "user2@example.com" },
      ];
      mockUserRepository.findAll.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
    });
  });

  describe("findOne", () => {
    it("should return user when found", async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      const result = await service.findOne("1");
      expect(result).toEqual(mockUser);
    });

    it("should throw NotFoundException when user not found", async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      await expect(service.findOne("999")).rejects.toThrow(NotFoundException);
      expect(mockErrorHandlingService.returnErrorOnNotFound).toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("should remove user successfully", async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.delete.mockResolvedValue(undefined);

      await service.remove("1");

      expect(mockUserRepository.delete).toHaveBeenCalledWith("1");
    });

    it("should throw NotFoundException when trying to remove non-existent user", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.remove("999")).rejects.toThrow(NotFoundException);
      expect(mockErrorHandlingService.returnErrorOnNotFound).toHaveBeenCalled();
    });
  });
});
