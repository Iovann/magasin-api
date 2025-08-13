import { Test, TestingModule } from "@nestjs/testing";
import { LocalStrategy } from "./local.strategy";
import { AuthService } from "../auth.service";
import { UnauthorizedException } from "@nestjs/common";
import { User } from "../../core/users/entities/user.entity";
import { Role } from "../../common/enum/role.enum";
import { ErrorHandlingService } from "../../common/response/error-handling";

describe("LocalStrategy", () => {
  let localStrategy: LocalStrategy;
  let authService: jest.Mocked<AuthService>;

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
        LocalStrategy,
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
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
      ],
    }).compile();

    localStrategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get(AuthService);
  });

  it("should be defined", () => {
    expect(localStrategy).toBeDefined();
  });

  describe("validate", () => {
    it("should return the user if validation is successful", async () => {
      authService.validateUser.mockResolvedValue(mockUser);

      const result = await localStrategy.validate(
        "test@example.com",
        "password",
      );

      expect(authService.validateUser).toHaveBeenCalledWith(
        "test@example.com",
        "password",
      );
      expect(result).toEqual(mockUser);
    });

    it("should throw UnauthorizedException if validation fails", async () => {
      authService.validateUser.mockResolvedValue(null as any);

      await expect(
        localStrategy.validate("test@example.com", "wrongpassword"),
      ).rejects.toThrow(UnauthorizedException);
      expect(authService.validateUser).toHaveBeenCalledWith(
        "test@example.com",
        "wrongpassword",
      );
    });
  });
});
