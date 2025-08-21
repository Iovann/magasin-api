import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  ForbiddenException,
  ConflictException,
  HttpException,
  HttpStatus,
  Global,
  UnauthorizedException,
} from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
import { InternalServerErrorException } from "@nestjs/common/exceptions/internal-server-error.exception";

@Global()
@Injectable()
export class ErrorHandlingService {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger) {}

  /**
   * Throws an UnauthorizedException with the specified error message.
   * Logs the error message before throwing the exception.
   */
  returnOnAuthorized(loggerMessage: string, ErrorMessage: string) {
    this.logger.error(loggerMessage);
    throw new UnauthorizedException(ErrorMessage);
  }

  /**
   * Throws a NotFoundException with the specified error message.
   * Logs the error message before throwing the exception.
   */
  returnErrorOnNotFound(loggerMessage: string, ErrorMessage: string) {
    this.logger.error(loggerMessage);
    throw new NotFoundException(ErrorMessage);
  }

  /**
   * Throws a BadRequestException with the specified error message.
   * Logs the error message before throwing the exception.
   */
  returnErrorOnBadRequest(loggerMessage: string, ErrorMessage: string) {
    this.logger.error(loggerMessage);
    throw new BadRequestException(ErrorMessage);
  }

  /**
   * Throws a ForbiddenException with the specified error message.
   * Logs the error message before throwing the exception.
   */
  returnErrorOnForbidden(loggerMessage: string, ErrorMessage: string) {
    this.logger.error(loggerMessage);
    throw new ForbiddenException(ErrorMessage);
  }

  /**
   * Throws a ConflictException with the specified error message.
   * Logs the error message before throwing the exception.
   */
  returnErrorOnConflict(loggerMessage: string, ErrorMessage: string) {
    this.logger.error(loggerMessage);
    throw new ConflictException(ErrorMessage);
  }

  returnErrorTooManyRequests(loggerMessage: string, ErrorMessage: string) {
    this.logger.error(loggerMessage);
    throw new HttpException(ErrorMessage, HttpStatus.TOO_MANY_REQUESTS);
  }

  /**
   * Throws an InternalServerErrorException with the specified error message.
   * Logs the error message before throwing the exception.
   */
  returnErrorOnInternalServerError(
    loggerMessage: string,
    errorMessage?: string | Error,
  ) {
    const message =
      typeof errorMessage === "string"
        ? errorMessage
        : errorMessage?.message || "An unexpected error occurred";

    this.logger.error(loggerMessage);
    throw new InternalServerErrorException(message);
  }

  /**
   * Formats validation errors into a BadRequestException.
   * Creates a BadRequestException with a message and the provided validation errors.
   */
  formatValidationErrors(errors: Record<string, string>): BadRequestException {
    this.logger.warn(`Validation errors: ${JSON.stringify(errors)}`);
    return new BadRequestException({
      message: "Validation failed",
      errors,
    });
  }

  /**
   * Handles errors originating from cache operations.
   * Logs the error and throws an InternalServerErrorException.
   * @param error The error object caught from a cache operation.
   * @example
   * try {
   *   await this.cacheService.get('some_key');
   * } catch (error) {
   *   this.errorHandlingService.handleCacheError(error);
   * }
   */
  handleCacheError(
    error: any,
    loggerMessage?: string,
    userMessage?: string,
  ): never {
    const log =
      loggerMessage ?? `Cache operation failed: ${error?.message || error}`;
    const message = userMessage ?? "Cache service is currently unavailable.";
    this.logger.error(log);
    throw new InternalServerErrorException(message);
  }

  /**
   * Throws an HttpException with a status of UNPROCESSABLE_ENTITY (Locked/validation-like).
   * Parameters are optional and have sensible defaults to simplify usage.
   */
  returnErrorOnLocked(loggerMessage?: string, errorMessage?: string) {
    const log =
      loggerMessage ?? "Resource is locked or request cannot be processed";
    const message =
      errorMessage ?? "The request cannot be processed at this time.";
    this.logger.error(log);
    throw new HttpException(message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
