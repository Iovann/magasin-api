import {
  Controller,
  Patch,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { UsersService } from "./services/users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { User } from "./entities/user.entity";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UseGuards } from "@nestjs/common";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enum/role.enum";
import { ThrottlerGuard } from "@nestjs/throttler";
import { Throttle } from "@nestjs/throttler";

@ApiTags("users")
@Controller("users")
@ApiBearerAuth("JWT-auth")
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Creates a new user.
   * @param createUserDto - The data for the new user.
   * @returns The created user.
   */

  @Post()
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @Roles(Role.SuperAdmin)
  @ApiOperation({
    summary: "Create a new user",
    description: "Creates a new user. Accessible only by SuperAdmins.",
  })
  @ApiResponse({
    status: 201,
    description: "The user has been successfully created.",
    type: User,
  })
  @ApiResponse({ status: 400, description: "Invalid input data." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  @ApiResponse({
    status: 409,
    description: "A user with this email already exists.",
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  /**
   * Retrieves a list of all users.
   * @returns An array of users.
   */
  @Get()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles(Role.SuperAdmin)
  @ApiOperation({
    summary: "Get all users",
    description:
      "Retrieves a list of all users. Accessible only by SuperAdmins.",
  })
  @ApiResponse({
    status: 200,
    description: "A list of users.",
    type: [User],
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  async findAll() {
    return await this.usersService.findAll();
  }

  /**
   * Retrieves statistics about users.
   * @returns User statistics.
   */
  @Get("stats")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles(Role.SuperAdmin)
  @ApiOperation({
    summary: "Get user statistics",
    description:
      "Retrieves statistics about users, including total count and count by role. Accessible only by SuperAdmins.",
  })
  @ApiResponse({
    status: 200,
    description: "User statistics retrieved successfully.",
    schema: {
      type: "object",
      properties: {
        total: { type: "number", example: 10 },
        byRole: {
          type: "object",
          example: { "super-admin": 1, storekeeper: 4, salesperson: 5 },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  async getStats() {
    return await this.usersService.getUserStats();
  }

  /**
   * Retrieves a single user by their unique ID.
   * @param id - The unique ID of the user.
   * @returns The user with the specified ID.
   */
  @Get(":id")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles(Role.SuperAdmin)
  @ApiOperation({
    summary: "Get a user by ID",
    description: "Retrieves a single user by their unique ID.",
  })
  @ApiParam({
    name: "id",
    description: "The unique ID of the user.",
    type: "string",
    example: "a-valid-uuid-or-id",
  })
  @ApiResponse({
    status: 200,
    description: "The user details.",
    type: User,
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  @ApiResponse({ status: 404, description: "User not found." })
  async findOne(@Param("id") id: string) {
    return await this.usersService.findOne(id);
  }

  /**
   * Deletes a user by their unique ID.
   * @param id - The unique ID of the user to delete.
   */
  @Delete(":id")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles(Role.SuperAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a user by ID",
    description:
      "Deletes a user by their unique ID. Accessible only by SuperAdmins.",
  })
  @ApiParam({
    name: "id",
    description: "The unique ID of the user to delete.",
    type: "string",
    example: "a-valid-uuid-or-id",
  })
  @ApiResponse({
    status: 204,
    description: "The user has been deleted successfully.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  @ApiResponse({ status: 404, description: "User not found." })
  async remove(@Param("id") id: string) {
    return await this.usersService.remove(id);
  }

  /**
   * Blocks a user by their unique ID.
   * @param id - The unique ID of the user to block.
   * @returns The updated user.
   */
  @Patch(":id/block")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Roles(Role.SuperAdmin)
  @ApiOperation({
    summary: "Block a user by ID",
    description:
      "Blocks a user by their unique ID. Accessible only by SuperAdmins.",
  })
  @ApiParam({
    name: "id",
    description: "The unique ID of the user to block.",
    type: "string",
    example: "a-valid-uuid-or-id",
  })
  @ApiResponse({
    status: 200,
    description: "The user has been blocked successfully.",
    type: User,
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  @ApiResponse({ status: 404, description: "User not found." })
  async blockUser(@Param("id") id: string) {
    return await this.usersService.blockUser(id);
  }

  /**
   * Unblocks a user by their unique ID.
   * @param id - The unique ID of the user to unblock.
   * @returns The updated user.
   */
  @Patch(":id/unblock")
  @Roles(Role.SuperAdmin)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Unblock a user by ID",
    description:
      "Unblocks a user by their unique ID. Accessible only by SuperAdmins.",
  })
  @ApiParam({
    name: "id",
    description: "The unique ID of the user to unblock.",
    type: "string",
    example: "a-valid-uuid-or-id",
  })
  @ApiResponse({
    status: 200,
    description: "The user has been unblocked successfully.",
    type: User,
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  @ApiResponse({ status: 404, description: "User not found." })
  async unblockUser(@Param("id") id: string) {
    return await this.usersService.unblockUser(id);
  }
}
