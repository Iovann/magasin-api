import { Test, TestingModule } from "@nestjs/testing";
import { JwtStrategy } from "./jwt.strategy";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../../core/users/services/users.service";
import { UnauthorizedException } from "@nestjs/common";
import { User } from "../../core/users/entities/user.entity";
import { Role } from "../../common/enum/role.enum";
import { ErrorHandlingService } from "../../common/response/error-handling";
import { TokenBlacklistService } from "../services/token-blacklist.service";

describe("JwtStrategy", () => {
  let jwtStrategy: JwtStrategy;
  let usersService: jest.Mocked<UsersService>;

  const mockUser: User = {
    id: "1",
    email: "test@example.com",
    role: Role.Vendeur,
    createdAt: new Date(),
    isBlocked: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue("test-secret"),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ErrorHandlingService,
          useValue: {
            returnOnAuthorized: jest.fn(() => {
              throw new UnauthorizedException();
            }),
          },
        },
        {
          provide: TokenBlacklistService,
          useValue: {
            isBlacklisted: jest.fn().mockResolvedValue(false),
          },
        },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get(UsersService);
  });

  it("should be defined", () => {
    expect(jwtStrategy).toBeDefined();
  });

  describe("validate", () => {
    it("should return the user if valid payload and user exists", async () => {
      usersService.findOne.mockResolvedValue(mockUser);
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };

      const result = await jwtStrategy.validate({} as any, payload);

      expect(usersService.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it("should throw UnauthorizedException if user does not exist", async () => {
      usersService.findOne.mockResolvedValue(undefined);
      const payload = {
        sub: "non-existent-id",
        email: "test@example.com",
        role: Role.Vendeur,
      };

      await expect(jwtStrategy.validate({} as any, payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findOne).toHaveBeenCalledWith("non-existent-id");
    });
  });
});
