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
import {
  SuperAdminOnly,
  UserPermissions,
} from "../../common/decorators/permissions.decorator";
import { UserAction } from "../../common/enum/permission.enum";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UseGuards } from "@nestjs/common";

@ApiTags("users")
@Controller("users")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @SuperAdminOnly()
  @UserPermissions([UserAction.CREATE])
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

  @Get()
  @SuperAdminOnly()
  @UserPermissions([UserAction.VIEW])
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

  @Get("stats")
  @SuperAdminOnly()
  @UserPermissions([UserAction.VIEW])
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

  @Get(":id")
  @SuperAdminOnly()
  @UserPermissions([UserAction.VIEW])
  @ApiOperation({
    summary: "Get a user by ID",
    description:
      "Retrieves a single user by their unique ID. Accessible only by SuperAdmins.",
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

  @Delete(":id")
  @SuperAdminOnly()
  @UserPermissions([UserAction.DELETE])
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

  @Patch(":id/block")
  @SuperAdminOnly()
  @UserPermissions([UserAction.UPDATE])
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


  @Patch(":id/unblock")
  @SuperAdminOnly()
  @UserPermissions([UserAction.UPDATE])
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
