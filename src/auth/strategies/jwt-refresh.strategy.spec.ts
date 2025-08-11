import { Test, TestingModule } from "@nestjs/testing";
import { JwtRefreshStrategy } from "./jwt-refresh.strategy";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../../core/users/services/users.service";
import { UnauthorizedException } from "@nestjs/common";
import { User } from "../../core/users/entities/user.entity";
import { Role } from "../../common/enum/role.enum";

describe("JwtRefreshStrategy", () => {
  let jwtRefreshStrategy: JwtRefreshStrategy;
  let usersService: jest.Mocked<UsersService>;

  const mockUser: User = {
    id: "1",
    email: "test@example.com",
    role: Role.Vendeur,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtRefreshStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue("test-refresh-secret"),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUserIfRefreshTokenMatches: jest.fn(),
          },
        },
      ],
    }).compile();

    jwtRefreshStrategy = module.get<JwtRefreshStrategy>(JwtRefreshStrategy);
    usersService = module.get(UsersService);
    configService = module.get(ConfigService);
  });

  it("should be defined", () => {
    expect(jwtRefreshStrategy).toBeDefined();
  });

  describe("validate", () => {
    it("should return the user if refresh token matches", async () => {
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };
      const mockRequest = {
        get: jest.fn().mockReturnValue("Bearer valid-refresh-token"),
      };
      usersService.getUserIfRefreshTokenMatches.mockResolvedValue(mockUser);

      const result = await jwtRefreshStrategy.validate(
        mockRequest as any,
        payload,
      );

      expect(mockRequest.get).toHaveBeenCalledWith("authorization");
      expect(usersService.getUserIfRefreshTokenMatches).toHaveBeenCalledWith(
        "valid-refresh-token",
        mockUser.id,
      );
      expect(result).toEqual(mockUser);
    });

    it("should throw UnauthorizedException if refresh token does not match", async () => {
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };
      const mockRequest = {
        get: jest.fn().mockReturnValue("Bearer invalid-refresh-token"),
      };
      usersService.getUserIfRefreshTokenMatches.mockResolvedValue(null);

      await expect(
        jwtRefreshStrategy.validate(mockRequest as any, payload),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockRequest.get).toHaveBeenCalledWith("authorization");
      expect(usersService.getUserIfRefreshTokenMatches).toHaveBeenCalledWith(
        "invalid-refresh-token",
        mockUser.id,
      );
    });

    it("should throw UnauthorizedException if authorization header is missing", async () => {
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };
      const mockRequest = {
        get: jest.fn().mockReturnValue(undefined),
      };

      await expect(
        jwtRefreshStrategy.validate(mockRequest as any, payload),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockRequest.get).toHaveBeenCalledWith("authorization");
    });
  });
});
