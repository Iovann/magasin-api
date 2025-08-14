import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { TokenRevocationInterceptor } from './token-revocation.interceptor';
import { TokenBlacklistService } from '../services/token-blacklist.service';

describe('TokenRevocationInterceptor', () => {
  let interceptor: TokenRevocationInterceptor;
  let tokenBlacklistService: jest.Mocked<TokenBlacklistService>;

  const mockTokenBlacklistService = {
    isBlacklisted: jest.fn(),
  };

  const mockCallHandler = {
    handle: () => of({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenRevocationInterceptor,
        {
          provide: TokenBlacklistService,
          useValue: mockTokenBlacklistService,
        },
      ],
    }).compile();

    interceptor = module.get<TokenRevocationInterceptor>(TokenRevocationInterceptor);
    tokenBlacklistService = module.get(TokenBlacklistService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should allow request when no authorization header', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            url: '/test',
            headers: {},
          }),
        }),
      } as ExecutionContext;

      const result = await firstValueFrom(interceptor.intercept(context, mockCallHandler));

      expect(result).toEqual({ success: true });
      expect(tokenBlacklistService.isBlacklisted).not.toHaveBeenCalled();
    });

    it('should allow request when authorization header does not start with Bearer', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            url: '/test',
            headers: {
              authorization: 'Basic dGVzdDp0ZXN0',
            },
          }),
        }),
      } as ExecutionContext;

      const result = await firstValueFrom(interceptor.intercept(context, mockCallHandler));

      expect(result).toEqual({ success: true });
      expect(tokenBlacklistService.isBlacklisted).not.toHaveBeenCalled();
    });

    it('should allow request when token is not blacklisted', async () => {
      const token = 'valid-token';
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            url: '/test',
            headers: {
              authorization: `Bearer ${token}`,
            },
          }),
        }),
      } as ExecutionContext;

      mockTokenBlacklistService.isBlacklisted.mockResolvedValue(false);

      const result = await firstValueFrom(interceptor.intercept(context, mockCallHandler));

      expect(result).toEqual({ success: true });
      expect(tokenBlacklistService.isBlacklisted).toHaveBeenCalledWith(token);
    });

    it('should block request when token is blacklisted', async () => {
      const token = 'blacklisted-token';
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            url: '/test',
            headers: {
              authorization: `Bearer ${token}`,
            },
          }),
        }),
      } as ExecutionContext;

      mockTokenBlacklistService.isBlacklisted.mockResolvedValue(true);

      await expect(
        firstValueFrom(interceptor.intercept(context, mockCallHandler))
      ).rejects.toThrow(UnauthorizedException);

      expect(tokenBlacklistService.isBlacklisted).toHaveBeenCalledWith(token);
    });

    it('should handle blacklist service errors gracefully', async () => {
      const token = 'test-token';
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            url: '/test',
            headers: {
              authorization: `Bearer ${token}`,
            },
          }),
        }),
      } as ExecutionContext;

      const error = new Error('Cache error');
      mockTokenBlacklistService.isBlacklisted.mockRejectedValue(error);

      const result = await firstValueFrom(interceptor.intercept(context, mockCallHandler));

      expect(result).toEqual({ success: true });
      expect(tokenBlacklistService.isBlacklisted).toHaveBeenCalledWith(token);
    });
  });
});
