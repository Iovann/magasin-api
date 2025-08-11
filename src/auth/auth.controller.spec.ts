import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { User } from '../core/users/entities/user.entity';
import { Role } from '../common/enum/role.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    role: Role.Vendeur,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            logout: jest.fn(),
            getTokens: jest.fn(),
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
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('login', () => {
    it('should return tokens when login is successful', async () => {
      const tokens = { accessToken: 'access', refreshToken: 'refresh' };
      authService.login.mockResolvedValue(tokens);
      const req = { user: mockUser };

      const result = await controller.login(req as any);

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(tokens);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with the userId', async () => {
      const req = { user: mockUser };
      await controller.logout(req as any);
      expect(authService.logout).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('refresh', () => {
    it('should return new tokens', async () => {
      const tokens = { accessToken: 'new-access', refreshToken: 'new-refresh' };
      const userWithRefreshToken = { ...mockUser, refreshToken: 'refresh' };
      authService.getTokens.mockResolvedValue(tokens);
      const req = { user: userWithRefreshToken };

      const result = await controller.refresh(req as any);

      expect(authService.getTokens).toHaveBeenCalledWith(mockUser.id, mockUser.email, mockUser.role);
      expect(result).toEqual(tokens);
    });
  });
});
