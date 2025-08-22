import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../core/users/services/users.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { User } from "../core/users/entities/user.entity";
import { Role } from "../common/enum/role.enum";
import {
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ErrorHandlingService } from "../common/response/error-handling";
import { TokenBlacklistService } from "./services/token-blacklist.service";
import { passwordHash } from "../utils/passwordHash/passwordHash.service";

describe("AuthService", () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let errorHandlingService: jest.Mocked<ErrorHandlingService>;
  let tokenBlacklistService: jest.Mocked<TokenBlacklistService>;
  let bcryptService: jest.Mocked<passwordHash>;

  const mockUser: User = {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    email: "test@example.com",
    role: Role.Vendeur,
    createdAt: new Date(),
    isBlocked: false,
  };

  beforeEach(async () => {
    const mockpasswordHash = {
      hashPassword: jest.fn().mockResolvedValue("hashedpassword"),
      comparePassword: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmailWithPassword: jest.fn(),
            setCurrentRefreshToken: jest.fn(),
            removeRefreshToken: jest.fn(),
            findByIdWithPassword: jest.fn(),
            updatePasswordHash: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "JWT_SECRET") return "secret";
              if (key === "JWT_REFRESH_SECRET") return "refresh-secret";
              if (key === "JWT_EXPIRATION_TIME") return "15m";
              if (key === "JWT_REFRESH_EXPIRATION_TIME") return "7d";
              return null;
            }),
          },
        },
        {
          provide: ErrorHandlingService,
          useValue: {
            returnOnAuthorized: jest.fn((code, message) => {
              throw new UnauthorizedException(message);
            }),
            returnErrorOnNotFound: jest.fn((code, message) => {
              throw new NotFoundException(message);
            }),
            returnErrorOnInternalServerError: jest.fn((code, message) => {
              throw new InternalServerErrorException(message);
            }),
          },
        },
        {
          provide: TokenBlacklistService,
          useValue: {
            addToBlacklist: jest.fn(),
            isBlacklisted: jest.fn(),
            ["cacheService"]: {
              set: jest.fn(),
              get: jest.fn(),
              has: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: passwordHash,
          useValue: mockpasswordHash,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    errorHandlingService = module.get(ErrorHandlingService);
    tokenBlacklistService = module.get(TokenBlacklistService);
    bcryptService = module.get(passwordHash) as jest.Mocked<passwordHash>;
  });

  describe("validateUser", () => {
    it("should return user if validation is successful", async () => {
      const userWithPassword = { ...mockUser, passwordHash: "hashedpassword" };
      usersService.findByEmailWithPassword.mockResolvedValue(userWithPassword);
      bcryptService.comparePassword.mockResolvedValue(true);

      const result = await authService.validateUser(
        "test@example.com",
        "password",
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...userWithoutPassword } = userWithPassword;
      expect(result).toEqual(userWithoutPassword);
    });

    it("should throw UnauthorizedException if user is blocked", async () => {
      const blockedUser = {
        ...mockUser,
        isBlocked: true,
        passwordHash: "hashedpassword",
      };
      usersService.findByEmailWithPassword.mockResolvedValue(blockedUser);

      await expect(
        authService.validateUser("test@example.com", "password"),
      ).rejects.toThrow(UnauthorizedException);
      expect(errorHandlingService.returnOnAuthorized).toHaveBeenCalledWith(
        "ERR_AUTH_SERVICE_002_VALIDATE_USER",
        "Your account has been blocked.",
      );
    });

    it("should throw UnauthorizedException if user not found", async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        authService.validateUser("test@example.com", "password"),
      ).rejects.toThrow(UnauthorizedException);
      expect(errorHandlingService.returnOnAuthorized).toHaveBeenCalledWith(
        "ERR_AUTH_SERVICE_001_VALIDATE_USER",
        "Invalid credentials",
      );
    });

    it("should throw UnauthorizedException if password does not match", async () => {
      const userWithPassword = { ...mockUser, passwordHash: "hashedpassword" };
      usersService.findByEmailWithPassword.mockResolvedValue(userWithPassword);
      bcryptService.comparePassword.mockResolvedValue(false);

      await expect(
        authService.validateUser("test@example.com", "password"),
      ).rejects.toThrow(UnauthorizedException);
      expect(errorHandlingService.returnOnAuthorized).toHaveBeenCalledWith(
        "ERR_AUTH_SERVICE_001_VALIDATE_USER",
        "Invalid credentials",
      );
    });
  });

  describe("login", () => {
    it("should return access and refresh tokens", async () => {
      jwtService.signAsync
        .mockResolvedValueOnce("accessToken")
        .mockResolvedValueOnce("refreshToken");
      const result = await authService.login(mockUser);

      expect(usersService.setCurrentRefreshToken).toHaveBeenCalledWith(
        "refreshToken",
        mockUser.id,
      );
      expect(result).toEqual({
        accessToken: "accessToken",
        refreshToken: "refreshToken",
      });
    });
  });

  describe("logout", () => {
    it("should call removeRefreshToken with userId and blacklist the token", async () => {
      const accessToken = "mockAccessToken";
      const decodedToken = { exp: Math.floor(Date.now() / 1000) + 3600 };
      jwtService.decode.mockReturnValue(decodedToken);

      await authService.logout(mockUser.id, accessToken);
      expect(usersService.removeRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(tokenBlacklistService.addToBlacklist).toHaveBeenCalledWith(
        accessToken,
        expect.any(Number),
      );
    });

    it("should not blacklist the token if it is expired", async () => {
      const accessToken = "mockAccessToken";
      const decodedToken = { exp: Math.floor(Date.now() / 1000) - 3600 };
      jwtService.decode.mockReturnValue(decodedToken);

      await authService.logout(mockUser.id, accessToken);
      expect(usersService.removeRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(tokenBlacklistService.addToBlacklist).not.toHaveBeenCalled();
    });

    it("should throw an error if removeRefreshToken fails", async () => {
      const accessToken = "mockAccessToken";
      const decodedToken = { exp: Math.floor(Date.now() / 1000) + 3600 };
      jwtService.decode.mockReturnValue(decodedToken);
      usersService.removeRefreshToken.mockRejectedValue(new Error("DB error"));

      await expect(
        authService.logout(mockUser.id, accessToken),
      ).rejects.toThrow(InternalServerErrorException);
      expect(
        errorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "ERR_AUTH_SERVICE_006_LOGOUT",
        "Failed to complete logout process",
      );
    });

    it("should call removeRefreshToken even if token decoding fails", async () => {
      const accessToken = "invalidToken";
      jwtService.decode.mockReturnValue(null);

      await authService.logout(mockUser.id, accessToken);
      expect(usersService.removeRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(tokenBlacklistService.addToBlacklist).not.toHaveBeenCalled();
    });
  });

  describe("getTokens", () => {
    it("should return access and refresh tokens", async () => {
      jwtService.signAsync
        .mockResolvedValueOnce("accessToken")
        .mockResolvedValueOnce("refreshToken");
      const result = await authService.getTokens(
        mockUser.id,
        mockUser.email,
        mockUser.role,
      );

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: "accessToken",
        refreshToken: "refreshToken",
      });
    });
  });

  describe("changePassword", () => {
    const userId = "1";
    const currentPassword = "oldPassword";
    const newPassword = "newPassword";
    const hashedPassword = "hashedNewPassword";
    const userWithPassword = { ...mockUser, passwordHash: "hashedOldPassword" };

    it("should successfully change the user's password", async () => {
      usersService.findByIdWithPassword.mockResolvedValue(userWithPassword);
      bcryptService.comparePassword.mockResolvedValue(true);
      bcryptService.hashPassword.mockResolvedValue(hashedPassword);
      usersService.updatePasswordHash.mockResolvedValue(undefined);

      const result = await authService.changePassword(
        userId,
        currentPassword,
        newPassword,
      );

      expect(usersService.findByIdWithPassword).toHaveBeenCalledWith(userId);
      expect(bcryptService.comparePassword).toHaveBeenCalledWith(
        currentPassword,
        userWithPassword.passwordHash,
      );
      expect(bcryptService.hashPassword).toHaveBeenCalledWith(newPassword);
      expect(usersService.updatePasswordHash).toHaveBeenCalledWith(
        userId,
        hashedPassword,
      );
      expect(result).toEqual({ message: "Password changed successfully." });
    });

    it("should throw an error if updatePasswordHash fails", async () => {
      usersService.findByIdWithPassword.mockResolvedValue(userWithPassword);
      bcryptService.comparePassword.mockResolvedValue(true);
      bcryptService.hashPassword.mockResolvedValue(hashedPassword);
      const dbError = new Error("DB error");
      usersService.updatePasswordHash.mockRejectedValue(dbError);

      await expect(
        authService.changePassword(userId, currentPassword, newPassword),
      ).rejects.toThrow(InternalServerErrorException);
      expect(
        errorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "ERR_AUTH_SERVICE_005_UPDATE_PASSWORD",
        `Error updating password, ${dbError}`,
      );
    });

    it("should throw NotFoundException if user is not found", async () => {
      usersService.findByIdWithPassword.mockResolvedValue(null);

      await expect(
        authService.changePassword(userId, currentPassword, newPassword),
      ).rejects.toThrow(NotFoundException);
      expect(errorHandlingService.returnErrorOnNotFound).toHaveBeenCalledWith(
        "ERR_AUTH_SERVICE_003_CHANGE_PASSWORD",
        "User not found.",
      );
    });

    it("should throw UnauthorizedException if current password is invalid", async () => {
      usersService.findByIdWithPassword.mockResolvedValue(userWithPassword);
      bcryptService.comparePassword.mockResolvedValue(false);

      await expect(
        authService.changePassword(userId, currentPassword, newPassword),
      ).rejects.toThrow(UnauthorizedException);
      expect(errorHandlingService.returnOnAuthorized).toHaveBeenCalledWith(
        "ERR_AUTH_SERVICE_004_CHANGE_PASSWORD",
        "Invalid current password.",
      );
    });
  });

  describe("checkTokenBlacklist", () => {
    it("should return true if token is blacklisted", async () => {
      const token = "blacklistedToken";
      tokenBlacklistService.isBlacklisted.mockResolvedValue(true);
      const result = await authService.checkTokenBlacklist(token);
      expect(result).toBe(true);
      expect(tokenBlacklistService.isBlacklisted).toHaveBeenCalledWith(token);
    });

    it("should return false if token is not blacklisted", async () => {
      const token = "notBlacklistedToken";
      tokenBlacklistService.isBlacklisted.mockResolvedValue(false);
      const result = await authService.checkTokenBlacklist(token);
      expect(result).toBe(false);
      expect(tokenBlacklistService.isBlacklisted).toHaveBeenCalledWith(token);
    });
  });

  describe("checkRedisStatus", () => {
    it("should return connected status if redis is working", async () => {
      const cacheService = tokenBlacklistService["cacheService"];
      (cacheService.get as jest.Mock).mockResolvedValue(
        "test-value-" + expect.any(Number),
      );
      (cacheService.has as jest.Mock).mockResolvedValue(true);

      const result = await authService.checkRedisStatus();
      expect(result.status).toBe("connected");
    });

    it("should return error status if redis is not working", async () => {
      const cacheService = tokenBlacklistService["cacheService"];
      (cacheService.set as jest.Mock).mockRejectedValue(
        new Error("Connection error"),
      );

      const result = await authService.checkRedisStatus();
      expect(result.status).toBe("error");
      expect(result.error).toBe("Connection error");
    });
  });
});
