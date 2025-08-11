import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../core/users/services/users.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { User } from "../core/users/entities/user.entity";
import { Role } from "../common/enum/role.enum";

jest.mock("bcrypt");
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("AuthService", () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: "1",
    email: "test@example.com",
    role: Role.Vendeur,
    createdAt: new Date(),
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
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
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
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
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
      const expectedResult = { ...userWithPassword };
      delete expectedResult.passwordHash;

      expect(result).toEqual(expectedResult);
    });

    it("should return null if user not found", async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);
      const result = await authService.validateUser(
        "test@example.com",
        "password",
      );
      expect(result).toBeNull();
    });

    it("should return null if password does not match", async () => {
      const userWithPassword = { ...mockUser, passwordHash: "hashedpassword" };
      usersService.findByEmailWithPassword.mockResolvedValue(userWithPassword);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await authService.validateUser(
        "test@example.com",
        "password",
      );
      expect(result).toBeNull();
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
    it("should call removeRefreshToken with userId", async () => {
      await authService.logout(mockUser.id);
      expect(usersService.removeRefreshToken).toHaveBeenCalledWith(mockUser.id);
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
});
