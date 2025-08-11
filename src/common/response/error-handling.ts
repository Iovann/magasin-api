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

  /**
   * Throws an HttpException with a status of UNPROCESSABLE_ENTITY and the specified error message.
   * Logs the error message before throwing the exception.
   */
  returnErrorOnLocked(loggerMessage: string, ErrorMessage: string) {
    this.logger.error(loggerMessage);
    throw new HttpException(ErrorMessage, HttpStatus.UNPROCESSABLE_ENTITY);
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
    ErrorMessage: string,
  ) {
    this.logger.error(loggerMessage);
    throw new InternalServerErrorException(ErrorMessage);
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
}
