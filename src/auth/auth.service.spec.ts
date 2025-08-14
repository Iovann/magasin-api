import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../core/users/services/users.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { User } from "../core/users/entities/user.entity";
import { Role } from "../common/enum/role.enum";
import { UnauthorizedException, NotFoundException } from "@nestjs/common";
import { ErrorHandlingService } from "../common/response/error-handling";
import { TokenBlacklistService } from "./services/token-blacklist.service"; // Added import

jest.mock("bcrypt");
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("AuthService", () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let errorHandlingService: jest.Mocked<ErrorHandlingService>;
  let tokenBlacklistService: jest.Mocked<TokenBlacklistService>; // Added mock instance

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
        AuthService,
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
            decode: jest.fn(), // Added decode mock
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
            returnOnAuthorized: jest.fn(() => {
              throw new UnauthorizedException("Invalid credentials");
            }),
            returnErrorOnNotFound: jest.fn(() => {
              throw new NotFoundException("User not found.");
            }),
          },
        },
        { // Added mock for TokenBlacklistService
          provide: TokenBlacklistService,
          useValue: {
            addToBlacklist: jest.fn(),
            isBlacklisted: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    errorHandlingService = module.get(ErrorHandlingService);
    tokenBlacklistService = module.get(TokenBlacklistService); // Get mock instance
  });

  describe("validateUser", () => {
    it("should return user if validation is successful", async () => {
      const userWithPassword = { ...mockUser, passwordHash: "hashedpassword" };
      usersService.findByEmailWithPassword.mockResolvedValue(userWithPassword);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await authService.validateUser(
        "test@example.com",
        "password",
      );
      const expectedResult = Object.fromEntries(
        Object.entries(userWithPassword).filter(
          ([key]) => key !== "passwordHash",
        ),
      );
      expect(result).toEqual(expectedResult);
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
      mockedBcrypt.compare.mockResolvedValue(false as never);

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
    it("should call removeRefreshToken with userId and blacklist the token", async () => { // Updated test description
      const accessToken = "mockAccessToken";
      const decodedToken = { exp: Math.floor(Date.now() / 1000) + 3600 }; // Token expires in 1 hour
      jwtService.decode.mockReturnValue(decodedToken); // Mock decode

      await authService.logout(mockUser.id, accessToken); // Updated call
      expect(usersService.removeRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(tokenBlacklistService.addToBlacklist).toHaveBeenCalledWith(accessToken, expect.any(Number)); // Check addToBlacklist
    });

    it("should call removeRefreshToken even if token decoding fails", async () => {
      const accessToken = "invalidToken";
      jwtService.decode.mockReturnValue(null); // Mock decode to return null

      await authService.logout(mockUser.id, accessToken);
      expect(usersService.removeRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(tokenBlacklistService.addToBlacklist).not.toHaveBeenCalled(); // Should not blacklist
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
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      usersService.updatePasswordHash.mockResolvedValue(undefined);

      await authService.changePassword(userId, currentPassword, newPassword);

      expect(usersService.findByIdWithPassword).toHaveBeenCalledWith(userId);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        currentPassword,
        userWithPassword.passwordHash,
      );
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(usersService.updatePasswordHash).toHaveBeenCalledWith(
        userId,
        hashedPassword,
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
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        authService.changePassword(userId, currentPassword, newPassword),
      ).rejects.toThrow(UnauthorizedException);
      expect(errorHandlingService.returnOnAuthorized).toHaveBeenCalledWith(
        "ERR_AUTH_SERVICE_004_CHANGE_PASSWORD",
        "Invalid current password.",
      );
    });
  });
});
