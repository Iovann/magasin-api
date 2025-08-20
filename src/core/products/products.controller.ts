import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ProductsService } from "./services/products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { SellProductDto } from "./dto/sell-product.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enum/role.enum";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { Product } from "./entities/product.entity";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

@ApiTags("products")
@ApiBearerAuth("JWT-auth")
@Controller("products")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Creates a new product.
   * @param createProductDto - The data for the new product.
   * @returns The created product.
   */
  
  @Post()
  @Roles(Role.SuperAdmin, Role.Magasinier)
  @ApiOperation({
    summary: "Create a new product",
    description: "Accessible by SuperAdmins and Storekeepers.",
  })
  @ApiResponse({
    status: 201,
    description: "The product has been successfully created.",
    type: Product,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data.",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden resource.",
  })
  @ApiResponse({
    status: 409,
    description: "Product with the same name or model already exists.",
  })
  async create(@Body() createProductDto: CreateProductDto) {
    return await this.productsService.create(createProductDto);
  }

  /**
   * Retrieves the total stock of all products.
   * @returns The total count of all products.
   */
  @Get("stock")
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({
    summary: "Get total stock of all products",
    description: "Accessible by SuperAdmins, Storekeepers, and Salespersons.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns the total count of all products.",
    schema: { type: "object", properties: { count: { type: "number" } } },
  })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  async getTotalStock() {
    return await this.productsService.getTotalStock();
  }

  /**
   * Retrieves a list of all products.
   * @returns An array of products.
   */
  @Get()
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({
    summary: "Get all products",
    description: "Accessible by SuperAdmins, Storekeepers, and Salespersons.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns a list of all products.",
    type: [Product],
  })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  async getAllProducts() {
    return await this.productsService.getAllProducts();
  }


  /**
   * Retrieves the stock count for a specific model.
   * @param modelName - The model name of the product.
   * @returns The stock count for the given model.
   */

  @Get("stock/:modelName")
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({
    summary: "Get stock count for a specific model",
    description: "Accessible by SuperAdmins, Storekeepers, and Salespersons.",
  })
  @ApiParam({
    name: "modelName",
    type: "string",
    description: "The model name of the product.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns the stock count for the given model.",
    schema: { type: "object", properties: { count: { type: "number" } } },
  })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  async getStockByModel(@Param("modelName") modelName: string) {
    return await this.productsService.getStockByModel(modelName);
  }



  /**
   * Retrieves a list of products matching the model name.
   * @param modelName - The model name to search for.
   * @returns An array of products matching the model name.
   */


  @Get("by-model/:modelName")
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({
    summary: "Get all products of a specific model",
    description: "Accessible by SuperAdmins, Storekeepers, and Salespersons.",
  })
  @ApiParam({
    name: "modelName",
    type: "string",
    description: "The model name to search for.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns a list of products matching the model name.",
    type: [Product],
  })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  async getProductsByModelName(@Param("modelName") modelName: string) {
    return await this.productsService.getProductsByModelName(modelName);
  }


  /**
   * Retrieves a list of products matching the name.
   * @param name - The name to search for.
   * @returns An array of products matching the name.
   */

  @Get("by-name/:name")
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({
    summary: "Get all products by name",
    description: "Accessible by SuperAdmins, Storekeepers, and Salespersons.",
  })
  @ApiParam({
    name: "name",
    type: "string",
    description: "The name to search for.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns a list of products matching the name.",
    type: [Product],
  })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  async getProductsByName(@Param("name") name: string) {
    return await this.productsService.getProductsByName(name);
  }


  /**
   * Retrieves the count of products matching the model name.
   * @param modelName - The model name to count.
   * @returns The count of products matching the model name.
   */

  @Get("count-by-model/:modelName")
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({
    summary: "Count products by model name",
    description: "Accessible by SuperAdmins, Storekeepers, and Salespersons.",
  })
  @ApiParam({
    name: "modelName",
    type: "string",
    description: "The model name to count.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns the number of products for the given model.",
    schema: { type: "object", properties: { count: { type: "number" } } },
  })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  async countProductsByModelName(@Param("modelName") modelName: string) {
    return await this.productsService.countProductsByModelName(modelName);
  }

  /**
   * Retrieves the count of products matching the name.
   * @param name - The name to count.
   * @returns The count of products matching the name.
   */

  @Get("count-by-name/:name")
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({
    summary: "Count products by name",
    description: "Accessible by SuperAdmins, Storekeepers, and Salespersons.",
  })
  @ApiParam({
    name: "name",
    type: "string",
    description: "The product name to count.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns the number of products for the given name.",
    schema: { type: "object", properties: { count: { type: "number" } } },
  })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  async countProductsByName(@Param("name") name: string) {
    return await this.productsService.countProductsByName(name);
  }

  /**
   * Retrieves a product by its unique ID.
   * @param id - The unique ID of the product.
   * @returns The product with the specified ID.
   */

  @Get(":id")
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({
    summary: "Get a product by its ID",
    description: "Accessible by SuperAdmins, Storekeepers, and Salespersons.",
  })
  @ApiParam({
    name: "id",
    type: "string",
    description: "The unique ID of the product.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns the details of the product.",
    type: Product,
  })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  @ApiResponse({ status: 404, description: "Product not found." })
  async getProductById(@Param("id") id: string) {
    return await this.productsService.getProductById(id);
  }


  /**
   * Updates the stock quantity of a product.
   * @param id - The unique ID of the product to update.
   * @param updateProductDto - The data for updating the product stock.
   * @returns The updated product.
   */
  @Put(":id/stock")
  @Roles(Role.SuperAdmin, Role.Magasinier)
  @ApiOperation({
    summary: "Update product stock",
    description:
      "Updates the stock quantity of a product. Accessible by SuperAdmins and Storekeepers.",
  })
  @ApiParam({
    name: "id",
    type: "string",
    description: "The unique ID of the product to update.",
  })
  @ApiResponse({
    status: 200,
    description: "The stock has been updated successfully.",
    type: Product,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid data (e.g., negative quantity).",
  })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  @ApiResponse({ status: 404, description: "Product not found." })
  async updateStock(
    @Param("id") id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productsService.updateStock(
      id,
      updateProductDto.quantity,
    );
  }

  /**
   * Sells a specified quantity of a product.
   * @param id - The unique ID of the product to sell.
   * @param sellProductDto - The data for selling the product.
   * @returns The updated product.
   */
  @Post(":id/sell")
  @Roles(Role.Vendeur, Role.SuperAdmin)
  @ApiOperation({
    summary: "Sell a product",
    description:
      "Sells a specified quantity of a product. Accessible by Salespersons.",
  })
  @ApiParam({
    name: "id",
    type: "string",
    description: "The unique ID of the product to sell.",
  })
  @ApiResponse({
    status: 200,
    description: "Product sold successfully.",
    type: Product,
  })
  @ApiResponse({
    status: 400,
    description: "Insufficient stock or invalid quantity.",
  })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  @ApiResponse({ status: 404, description: "Product not found." })
  async sellProduct(
    @Param("id") id: string,
    @Body() sellProductDto: SellProductDto,
  ) {
    return await this.productsService.sellProduct(id, sellProductDto.quantity);
  }

  /**
   * Deletes a product by its unique ID.
   * @param id - The unique ID of the product to delete.
   */
  @Delete(":id")
  @Roles(Role.SuperAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a product by ID",
    description: "Accessible only by SuperAdmins.",
  })
  @ApiParam({
    name: "id",
    type: "string",
    description: "The unique ID of the product to delete.",
  })
  @ApiResponse({
    status: 204,
    description: "The product has been deleted successfully.",
  })
  @ApiResponse({ status: 403, description: "Forbidden resource." })
  @ApiResponse({ status: 404, description: "Product not found." })
  async remove(@Param("id") id: string) {
    return await this.productsService.remove(id);
  }
}
