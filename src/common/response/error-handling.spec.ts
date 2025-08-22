import { Test, TestingModule } from "@nestjs/testing";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  HttpStatus,
} from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { ErrorHandlingService } from "./error-handling";

describe("ErrorHandlingService", () => {
  let service: ErrorHandlingService;
  let mockLogger: any;

  let module: TestingModule;
  beforeEach(async () => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        ErrorHandlingService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<ErrorHandlingService>(ErrorHandlingService);
  });

  afterEach(() => {
    module.close();
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("returnOnAuthorized", () => {
    it("should throw UnauthorizedException and log error", () => {
      const loggerMessage = "ERR_AUTH_LOGIN_FAILED";
      const errorMessage = "Invalid credentials";
      expect(() =>
        service.returnOnAuthorized(loggerMessage, errorMessage),
      ).toThrow(UnauthorizedException);
      expect(mockLogger.error).toHaveBeenCalledWith(loggerMessage);
    });
  });

  describe("returnErrorOnNotFound", () => {
    it("should throw NotFoundException and log error", () => {
      const loggerMessage = "ERR_PRODUCT_NOT_FOUND";
      const errorMessage = "Product not found";
      expect(() =>
        service.returnErrorOnNotFound(loggerMessage, errorMessage),
      ).toThrow(NotFoundException);
      expect(mockLogger.error).toHaveBeenCalledWith(loggerMessage);
    });
  });

  describe("returnErrorOnBadRequest", () => {
    it("should throw BadRequestException and log error", () => {
      const loggerMessage = "ERR_VALIDATION_FAILED";
      const errorMessage = "Invalid input data";
      expect(() =>
        service.returnErrorOnBadRequest(loggerMessage, errorMessage),
      ).toThrow(BadRequestException);
      expect(mockLogger.error).toHaveBeenCalledWith(loggerMessage);
    });
  });

  describe("returnErrorOnForbidden", () => {
    it("should throw ForbiddenException and log error", () => {
      const loggerMessage = "ERR_PERMISSION_DENIED";
      const errorMessage = "Access denied";
      expect(() =>
        service.returnErrorOnForbidden(loggerMessage, errorMessage),
      ).toThrow(ForbiddenException);
      expect(mockLogger.error).toHaveBeenCalledWith(loggerMessage);
    });
  });

  describe("returnErrorOnConflict", () => {
    it("should throw ConflictException and log error", () => {
      const loggerMessage = "ERR_USER_ALREADY_EXISTS";
      const errorMessage = "User already exists";
      expect(() =>
        service.returnErrorOnConflict(loggerMessage, errorMessage),
      ).toThrow(ConflictException);
      expect(mockLogger.error).toHaveBeenCalledWith(loggerMessage);
    });
  });

  describe("returnErrorOnLocked", () => {
    it("should throw HttpException with UNPROCESSABLE_ENTITY and log error", () => {
      const loggerMessage = "ERR_RESOURCE_LOCKED";
      const errorMessage = "Resource is locked";
      expect(() =>
        service.returnErrorOnLocked(loggerMessage, errorMessage),
      ).toThrow(
        new HttpException(errorMessage, HttpStatus.UNPROCESSABLE_ENTITY),
      );
      expect(mockLogger.error).toHaveBeenCalledWith(loggerMessage);
    });
  });

  describe("returnErrorTooManyRequests", () => {
    it("should throw HttpException with TOO_MANY_REQUESTS and log error", () => {
      const loggerMessage = "ERR_RATE_LIMIT_EXCEEDED";
      const errorMessage = "Too many requests";
      expect(() =>
        service.returnErrorTooManyRequests(loggerMessage, errorMessage),
      ).toThrow(new HttpException(errorMessage, HttpStatus.TOO_MANY_REQUESTS));
      expect(mockLogger.error).toHaveBeenCalledWith(loggerMessage);
    });
  });

  describe("returnErrorOnInternalServerError", () => {
    it("should throw InternalServerErrorException and log error", () => {
      const loggerMessage = "ERR_INTERNAL_SERVER_ERROR";
      const errorMessage = "Something went wrong";
      expect(() =>
        service.returnErrorOnInternalServerError(loggerMessage, errorMessage),
      ).toThrow(InternalServerErrorException);
      expect(mockLogger.error).toHaveBeenCalledWith(loggerMessage);
    });
  });

  describe("formatValidationErrors", () => {
    it("should return BadRequestException with formatted errors", () => {
      const errors = {
        username: "Username is required",
        email: "Invalid email format",
      };
      const exception = service.formatValidationErrors(errors);
      expect(exception).toBeInstanceOf(BadRequestException);
      expect(exception.getResponse()).toEqual({
        message: "Validation failed",
        errors,
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Validation errors: ${JSON.stringify(errors)}`,
      );
    });
  });
});
