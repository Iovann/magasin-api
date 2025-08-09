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
} from "@nestjs/common";
import { ProductsService } from "./services/products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { SellProductDto } from "./dto/sell-product.dto";
// import { AuthGuard } from '../../common/guards/auth.guard';
// import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enum/role.enum";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

@ApiTags("products")
@ApiBearerAuth("JWT-auth")
// @UseGuards(AuthGuard, RolesGuard)
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Creates a new product.
   * @param createProductDto - The product data.
   * @returns The created product.
   */
  @Post()
  @Roles(Role.SuperAdmin, Role.Magasinier)
  @ApiOperation({
    summary: "Creates a new water gun model (SuperAdmin, Storekeeper)",
  })
  @ApiResponse({
    status: 201,
    description: "The water gun was created successfully.",
  })
  @ApiResponse({ status: 400, description: "Invalid data." })
  @ApiResponse({ status: 403, description: "Access denied." })
  async create(@Body() createProductDto: CreateProductDto) {
    return await this.productsService.create(createProductDto);
  }

  /**
   * Gets the total stock of all products.
   * @returns The total stock count.
   */
  @Get("stock")
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: "Gets the total number of all water guns" })
  @ApiResponse({
    status: 200,
    description: "Total number of water guns returned.",
  })
  async getTotalStock() {
    return await this.productsService.getTotalStock();
  }

  // @Get('stock/:modelName')
  // @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  // @ApiOperation({ summary: 'Gets the stock for a specific gun model' })
  // @ApiResponse({ status: 200, description: 'Stock of the model returned.' })
  // @ApiResponse({ status: 404, description: 'Model not found.' })
  // getStockByModel(@Param('mo  delName') modelName: string) {
  //   return this.productsService.getStockByModel(modelName);
  // }

  /**
   * Deletes a product by its ID.
   * @param id - The ID of the product to delete.
   */
  @Delete(":id")
  @Roles(Role.SuperAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Deletes a water gun model by its ID (SuperAdmin)" })
  @ApiResponse({
    status: 204,
    description: "The water gun model was deleted successfully.",
  })
  @ApiResponse({ status: 404, description: "Water gun model not found." })
  async remove(@Param("id") id: string) {
    return await this.productsService.remove(id);
  }

  /**
   * Gets a product by its ID.
   * @param id - The ID of the product.
   * @returns The product.
   */
  @Get(":id")
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: "Gets a water gun model by its ID" })
  @ApiResponse({ status: 200, description: "Water gun model details returned." })
  @ApiResponse({ status: 404, description: "Water gun model not found." })
  async getProductById(@Param("id") id: string) {
    return await this.productsService.getProductById(id);
  }

  /**
   * Gets all products.
   * @returns A list of all products.
   */
  @Get()
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: "Gets the list of all water guns" })
  @ApiResponse({ status: 200, description: "List of water guns returned." })
  async getAllProducts() {
    return await this.productsService.getAllProducts();
  }

  /**
   * Updates the stock of a product.
   * @param id - The ID of the product to update.
   * @param updateProductDto - The new quantity.
   * @returns The updated product.
   */
  @Put(":id")
  @Roles(Role.SuperAdmin, Role.Magasinier)
  @ApiOperation({
    summary:
      "Updates the stock quantity of a water gun model (SuperAdmin, Storekeeper)",
  })
  @ApiResponse({ status: 200, description: "The stock was updated successfully." })
  @ApiResponse({ status: 400, description: "Invalid data." })
  @ApiResponse({ status: 404, description: "Water gun model not found." })
  async updateStock(
    @Param("id") id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productsService.updateStock(id, updateProductDto.quantity);
  }

  /**
   * Sells a product.
   * @param id - The ID of the product to sell.
   * @param sellProductDto - The quantity to sell.
   * @returns The updated product.
   */
  @Post(":id/sell")
  @Roles(Role.Vendeur)
  @ApiOperation({ summary: "Sells a quantity of a water gun model (Salesperson)" })
  @ApiResponse({ status: 200, description: "Water gun model sold successfully." })
  @ApiResponse({
    status: 400,
    description: "Insufficient quantity in stock or invalid data.",
  })
  @ApiResponse({ status: 404, description: "Water gun model not found." })
  async sellProduct(@Param("id") id: string, @Body() sellProductDto: SellProductDto) {
    return await this.productsService.sellProduct(id, sellProductDto.quantity);
  }

  /**
   * Gets products by model name.
   * @param modelName - The model name to search for.
   * @returns A list of products.
   */
  @Get("by-model/:modelName")
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: "Gets all water guns by model name" })
  @ApiResponse({
    status: 200,
    description: "List of water guns by model returned.",
  })
  async getProductsByModelName(@Param("modelName") modelName: string) {
    return await this.productsService.getProductsByModelName(modelName);
  }

  /**
   * Gets products by name.
   * @param name - The name to search for.
   * @returns A list of products.
   */
  @Get("by-name/:name")
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: "Gets all water guns by name" })
  @ApiResponse({ status: 200, description: "List of water guns by name returned." })
  async getProductsByName(@Param("name") name: string) {
    return await this.productsService.getProductsByName(name);
  }

  /**
   * Counts products by model name.
   * @param modelName - The model name to count.
   * @returns The count of products.
   */
  @Get("count-by-model/:modelName")
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: "Counts the number of water guns by model name" })
  @ApiResponse({
    status: 200,
    description: "Number of water guns by model returned.",
  })
  async countProductsByModelName(@Param("modelName") modelName: string) {
    return await this.productsService.countProductsByModelName(modelName);
  }

  /**
   * Counts products by name.
   * @param name - The name to count.
   * @returns The count of products.
   */
  @Get("count-by-name/:name")
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: "Counts the number of water guns by name" })
  @ApiResponse({ status: 200, description: "Number of water guns by name returned." })
  async countProductsByName(@Param("name") name: string) {
    return await this.productsService.countProductsByName(name);
  }
}
