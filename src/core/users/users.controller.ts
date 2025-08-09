import { Controller, Get, Post, Body, Param, Delete } from "@nestjs/common";
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

/**
 * Controller for handling user-related API requests.
 */
@ApiTags("users")
// @UseGuards(AuthGuard, RolesGuard)
@Controller("users")
@ApiBearerAuth("JWT-auth")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Creates a new user.
   * @param createUserDto - The user data to create.
   * @returns The newly created user.
   */
  @ApiOperation({
    summary: "Create a new user",
    description:
      "Only SuperAdmins can create users. Requires JWT authentication.",
  })
  @ApiResponse({
    status: 201,
    description: "User created successfully",
    type: User,
  })
  @ApiResponse({ status: 400, description: "Invalid data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - SuperAdmin access required",
  })
  @ApiResponse({
    status: 409,
    description: "User with this email already exists",
  })
  @Post()
  @SuperAdminOnly()
  @UserPermissions([UserAction.CREATE])
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  /**
   * Finds all users.
   * @returns A list of all users.
   */
  @ApiOperation({
    summary: "Get all users",
    description: "Only SuperAdmins can view the full list of users.",
  })
  @ApiResponse({
    status: 200,
    description: "User list retrieved successfully",
    type: [User],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - SuperAdmin access required",
  })
  @Get()
  @SuperAdminOnly()
  @UserPermissions([UserAction.VIEW])
  async findAll() {
    return await this.usersService.findAll();
  }

  /**
   * Gets user statistics.
   * @returns An object with total users and a count by role.
   */
  @ApiOperation({
    summary: "Get user statistics",
    description: "Retrieves the total number of users and the distribution by role.",
  })
  @ApiResponse({
    status: 200,
    description: "Statistics retrieved successfully",
    schema: {
      type: "object",
      properties: {
        total: { type: "number", example: 5 },
        byRole: {
          type: "object",
          example: {
            "super-admin": 1,
            storekeeper: 2,
            salesperson: 2,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - SuperAdmin access required",
  })
  @Get("stats")
  @SuperAdminOnly()
  @UserPermissions([UserAction.VIEW])
  async getStats() {
    return await this.usersService.getUserStats();
  }

  /**
   * Finds a single user by their ID.
   * @param id - The ID of the user to find.
   * @returns The user.
   */
  @ApiOperation({ summary: "Get a user by ID" })
  @ApiParam({
    name: "id",
    description: "User ID",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiResponse({ status: 200, description: "User found", type: User })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - SuperAdmin access required",
  })
  @ApiResponse({ status: 404, description: "User not found" })
  @Get(":id")
  @SuperAdminOnly()
  @UserPermissions([UserAction.VIEW])
  async findOne(@Param("id") id: string) {
    return await this.usersService.findOne(id);
  }

  /**
   * Deletes a user by their ID.
   * @param id - The ID of the user to delete.
   */
  @ApiOperation({ summary: "Delete a user" })
  @ApiParam({
    name: "id",
    description: "ID of the user to delete",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - SuperAdmin access required",
  })
  @ApiResponse({ status: 404, description: "User not found" })
  @Delete(":id")
  @SuperAdminOnly()
  @UserPermissions([UserAction.DELETE])
  async remove(@Param("id") id: string) {
    return await this.usersService.remove(id);
  }
}
