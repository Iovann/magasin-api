import {
  CallHandler,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { TokenBlacklistService } from '../services/token-blacklist.service';
import { TokenRevocationInterceptor } from './token-revocation.interceptor';
describe('TokenRevocationInterceptor', () => {
  let interceptor: TokenRevocationInterceptor;
  let tokenBlacklistService: jest.Mocked<TokenBlacklistService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenRevocationInterceptor,
        {
          provide: TokenBlacklistService,
          useValue: {
            isBlacklisted: jest.fn(),
          },
        },
      ],
    }).compile();

    interceptor = module.get<TokenRevocationInterceptor>(
      TokenRevocationInterceptor,
    );
    tokenBlacklistService = module.get(TokenBlacklistService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockExecutionContext = (headers: any = {}): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
        }),
      }),
    }) as any;

  const mockCallHandler: CallHandler = {
    handle: jest.fn(() => of('next handler')),
  };

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should pass if no authorization header is present', async () => {
    const context = mockExecutionContext();
    await interceptor.intercept(context, mockCallHandler);
    expect(tokenBlacklistService.isBlacklisted).not.toHaveBeenCalled();
    expect(mockCallHandler.handle).toHaveBeenCalled();
  });

  it('should pass if authorization header is not a Bearer token', async () => {
    const context = mockExecutionContext({ authorization: 'Basic some-token' });
    await interceptor.intercept(context, mockCallHandler);
    expect(tokenBlacklistService.isBlacklisted).not.toHaveBeenCalled();
    expect(mockCallHandler.handle).toHaveBeenCalled();
  });

  it('should pass if token is not blacklisted', async () => {
    const token = 'valid-token';
    const context = mockExecutionContext({ authorization: `Bearer ${token}` });
    tokenBlacklistService.isBlacklisted.mockResolvedValue(false);
    await interceptor.intercept(context, mockCallHandler);
    expect(tokenBlacklistService.isBlacklisted).toHaveBeenCalledWith(token);
    expect(mockCallHandler.handle).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if token is blacklisted', async () => {
    const token = 'revoked-token';
    const context = mockExecutionContext({ authorization: `Bearer ${token}` });
    tokenBlacklistService.isBlacklisted.mockResolvedValue(true);
    await expect(interceptor.intercept(context, mockCallHandler)).rejects.toThrow(UnauthorizedException);
    expect(tokenBlacklistService.isBlacklisted).toHaveBeenCalledWith(token);
    expect(mockCallHandler.handle).not.toHaveBeenCalled();
  });
});
