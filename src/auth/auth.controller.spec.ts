import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { User } from "../core/users/entities/user.entity";
import { Role } from "../common/enum/role.enum";
import { UnauthorizedException } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser: User = {
    id: "1",
    email: "test@example.com",
    role: Role.Vendeur,
    createdAt: new Date(),
    isBlocked: false,
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            logout: jest.fn(),
            getTokens: jest.fn(),
            changePassword: jest.fn(),
            checkTokenBlacklist: jest.fn(),
            checkRedisStatus: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtRefreshGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleFixture.get<AuthController>(AuthController);
    authService = moduleFixture.get(AuthService);
  });

  describe("login", () => {
    it("should return tokens when login is successful", async () => {
      const tokens = { accessToken: "access", refreshToken: "refresh" };
      authService.login.mockResolvedValue(tokens);
      const req = { user: mockUser };

      const result = await controller.login(req as any);

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(tokens);
    });
  });

  describe("logout", () => {
    it("should call authService.logout with the userId and accessToken", async () => {
      const req = { user: mockUser };
      const mockAccessToken = "mockAccessToken";
      const authHeader = `Bearer ${mockAccessToken}`;

      await controller.logout(req as any, authHeader);
      expect(authService.logout).toHaveBeenCalledWith(
        mockUser.id,
        mockAccessToken,
      );
    });

    it("should not call authService.logout if token is missing", async () => {
      const req = { user: mockUser };
      await controller.logout(req as any, "");
      expect(authService.logout).not.toHaveBeenCalled();
    });
  });

  describe("refresh", () => {
    it("should return new tokens", async () => {
      const tokens = { accessToken: "new-access", refreshToken: "new-refresh" };
      const userWithRefreshToken = { ...mockUser, refreshToken: "refresh" };
      authService.getTokens.mockResolvedValue(tokens);
      const req = { user: userWithRefreshToken };

      const result = await controller.refresh(req as any);

      expect(authService.getTokens).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        mockUser.role,
      );
      expect(result).toEqual(tokens);
    });
  });

  describe("changePassword", () => {
    const changePasswordDto = {
      currentPassword: "oldPass",
      newPassword: "newPass",
      confirmNewPassword: "newPass",
    };

    it("should change password successfully", async () => {
      authService.changePassword.mockResolvedValue({
        message: "Password changed successfully.",
      });
      const req = { user: mockUser };

      await controller.changePassword(req as any, changePasswordDto);

      expect(authService.changePassword).toHaveBeenCalledWith(
        mockUser.id,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );
    });

    it("should rethrow UnauthorizedException from authService", async () => {
      authService.changePassword.mockRejectedValue(
        new UnauthorizedException("Invalid current password."),
      );
      const req = { user: mockUser };

      await expect(
        controller.changePassword(req as any, changePasswordDto),
      ).rejects.toThrow(UnauthorizedException);
      expect(authService.changePassword).toHaveBeenCalledWith(
        mockUser.id,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );
    });
  });

  describe("testToken", () => {
    it("should return a success message with user details", async () => {
      const req = { user: mockUser };
      const result = await controller.testToken(req as any);
      expect(result).toEqual({
        message: "Token is valid",
        userId: mockUser.id,
        email: mockUser.email,
      });
    });
  });

  describe("checkBlacklist", () => {
    it("should return blacklisted status", async () => {
      const req = { user: mockUser };
      const token = "test-token";
      const authHeader = `Bearer ${token}`;
      authService.checkTokenBlacklist.mockResolvedValue(true);

      const result = await controller.checkBlacklist(req as any, authHeader);

      expect(authService.checkTokenBlacklist).toHaveBeenCalledWith(token);
      expect(result.blacklisted).toBe(true);
    });

    it("should return a message if no token is provided", async () => {
      const req = { user: mockUser };
      const result = await controller.checkBlacklist(req as any, "");
      expect(result.message).toBe("No token provided");
      expect(result.blacklisted).toBe(false);
      expect(authService.checkTokenBlacklist).not.toHaveBeenCalled();
    });
  });

  describe("checkRedisStatus", () => {
    it("should return redis status", async () => {
      const status = { status: "connected" };
      authService.checkRedisStatus.mockResolvedValue(status);

      const result = await controller.checkRedisStatus();

      expect(authService.checkRedisStatus).toHaveBeenCalled();
      expect(result).toEqual(status);
    });
  });
});
