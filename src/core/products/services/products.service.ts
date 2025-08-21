import { Injectable, Inject, Logger } from "@nestjs/common";
import { CreateProductDto } from "../dto/create-product.dto";
import { IProductRepository } from "../repositories/product.repository";
import { Product } from "../entities/product.entity";
import { ErrorHandlingService } from "../../../common/response/error-handling";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { CacheService } from "../../../libs/cache/cache.service";

/**
 * Service for handling product-related operations.
 */
@Injectable()
export class ProductsService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @Inject(IProductRepository)
    private readonly productRepository: IProductRepository,
    private readonly errorHandlingService: ErrorHandlingService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Creates a new product.
   * @param createProductDto - The data to create the product.
   * @returns The created product.
   * @throws {ConflictException} If a product with the same model name or name already exists.
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    this.logger.log({
      message: "Attempting to create a new product",
      ...createProductDto,
    });
    const existingProductByModelName =
      await this.productRepository.countByModelName(createProductDto.modelName);
    if (existingProductByModelName > 0) {
      throw this.errorHandlingService.returnErrorOnConflict(
        `[ERR_PROD_CREATE_MODEL_CONFLICT] Model ${createProductDto.modelName} already exists`,
        "A product with this model already exists",
      );
    }

    try {
      const product = await this.productRepository.create(createProductDto);

      // Invalidate relevant caches
      await Promise.all([
        this.cacheService.delete("products:list"),
        this.cacheService.delete(`products:count:model:${product.modelName}`),
        this.cacheService.delete(`products:count:name:${product.name}`),
      ]);

      this.logger.log({
        message: "Product created successfully",
        id: product.id,
      });
      return product;
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_PROD_CREATE_CRITICAL] Critical error: ${error.message}`,
        "Failed to create product",
      );
    }
  }

  /**
   * Gets the total number of products.
   * @returns The total number of products.
   */
  async getTotalStock(): Promise<{ count: number }> {
    this.logger.log({ message: "Fetching total product stock" });
    try {
      const count = await this.productRepository.count();
      this.logger.log({ message: `Total stock count: ${count}` });
      return { count };
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_PROD_GET_TOTAL_STOCK] Error getting total stock: ${error.message}`,
        "An error occurred while getting the total stock",
      );
    }
  }

  /**
   * Gets all products.
   * @returns A list of all products.
   */
  async getAllProducts(): Promise<Product[]> {
    this.logger.log({ message: "Fetching all products" });
    const cacheKey = "products:list";
    try {
      return await this.cacheService.getOrSet(
        cacheKey,
        async () => {
          const products = await this.productRepository.findAll();
          this.logger.log({ message: `Found ${products.length} products` });
          return products;
        },
        { ttl: 300 },
      );
    } catch (error) {
      const errorMessage = `[ERR_PROD_GET_ALL_PRODUCTS] Error getting all products: ${error.message}`;
      this.logger.error(errorMessage, { stack: error.stack });
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        errorMessage,
        "An error occurred while getting all products",
      );
    }
  }

  /**
   * Gets a product by its ID.
   * @param id - The ID of the product.
   * @returns The product or null if not found.
   */
  async getProductById(id: string): Promise<Product | null> {
    this.logger.log({ message: `Fetching product by ID: ${id}` });
    try {
      const cacheKey = `products:findOne:${id}`;
      return this.cacheService.getOrSet(
        cacheKey,
        async () => {
          const product = await this.productRepository.findById(id);
          if (product) {
            this.logger.log({
              message: `Found product with ID ${id}`,
              product,
            });
          } else {
            this.logger.log({ message: `Product with ID ${id} not found` });
          }
          return product;
        },
        { ttl: 3600 },
      );
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_PROD_GET_PRODUCT_BY_ID] Error getting product by ID: ${error.message}`,
        "An error occurred while getting the product by ID",
      );
    }
  }

  /**
   * Gets the stock count for a specific model.
   * @param modelName - The model name to search for.
   * @returns The number of products for the given model name.
   */
  async getStockByModel(modelName: string): Promise<{ count: number }> {
    this.logger.log({ message: `Fetching stock for model: ${modelName}` });
    try {
      const cacheKey = `products:count:model:${modelName}`;
      const count = await this.cacheService.getOrSet(
        cacheKey,
        async () => {
          return await this.productRepository.countByModelName(modelName);
        },
        { ttl: 3600 },
      );
      this.logger.log({
        message: `Stock count for model ${modelName}: ${count}`,
      });
      return { count };
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_PROD_GET_STOCK_BY_MODEL] Error getting stock by model: ${error.message}`,
        "An error occurred while getting the stock by model",
      );
    }
  }

  /**
   * Sells a certain quantity of a product.
   * @param id - The ID of the product to sell.
   * @param quantity - The quantity to sell.
   * @returns The updated product.
   * @throws {NotFoundException} If the product is not found.
   * @throws {BadRequestException} If the requested quantity is larger than the stock.
   */
  async sellProduct(id: string, quantity: number): Promise<Product> {
    this.logger.log({ message: `Attempting to sell product ${id}`, quantity });
    if (quantity <= 0) {
      throw this.errorHandlingService.returnErrorOnBadRequest(
        `[ERR_PROD_SELL_INVALID_QTY] Invalid quantity: ${quantity}`,
        "The quantity must be positive",
      );
    }

    const product = await this.getProductById(id); // Using cached version
    if (!product) {
      throw this.errorHandlingService.returnErrorOnNotFound(
        `[ERR_PROD_SELL_NOT_FOUND] Product ${id} not found`,
        "Product not found",
      );
    }

    if (product.quantity < quantity) {
      throw this.errorHandlingService.returnErrorOnBadRequest(
        `[ERR_PROD_SELL_INSUFFICIENT_STOCK] Insufficient stock for ${product.name}`,
        `Insufficient stock for ${product.name}. Available quantity: ${product.quantity}`,
      );
    }

    try {
      const updatedProduct = await this.productRepository.update(id, {
        quantity: product.quantity - quantity,
      });

      if (!updatedProduct) {
        throw this.errorHandlingService.returnErrorOnNotFound(
          `[ERR_PROD_UPDATE_FAILED] Failed to update product ${id}`,
          "Failed to update product",
        );
      }

      // Invalidate relevant caches
      await Promise.all([
        this.cacheService.delete(`products:findOne:${id}`),
        this.cacheService.delete("products:list"),
        this.cacheService.delete(`products:count:model:${product.modelName}`),
        this.cacheService.delete(`products:count:name:${product.name}`),
      ]);

      this.logger.log({
        message: `Product ${id} sold successfully`,
        quantitySold: quantity,
        newStock: updatedProduct.quantity,
      });
      return updatedProduct;
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_PROD_SELL_CRITICAL] Critical error during sale: ${error?.message}`,
        "An error occurred while processing the sale",
      );
    }
  }

  /**
   * Updates a product with the provided data
   * @param id - The ID of the product to update
   * @param updateData - The data to update the product with
   * @returns The updated product
   * @throws {NotFoundException} If the product is not found
   * @throws {ConflictException} If the update would create a duplicate model name
   * @throws {BadRequestException} If the update data is invalid
   */
  async update(
    id: string,
    updateData: Partial<CreateProductDto>,
  ): Promise<Product> {
    this.logger.log({
      message: `Attempting to update product ${id}`,
      updateData,
    });

    // Check if the product exists
    const existingProduct = await this.getProductById(id);
    if (!existingProduct) {
      throw this.errorHandlingService.returnErrorOnNotFound(
        `[ERR_PROD_UPDATE_NOT_FOUND] Product ${id} not found`,
        "Product not found",
      );
    }

    // If modelName is being updated, check for conflicts
    if (
      updateData.modelName &&
      updateData.modelName !== existingProduct.modelName
    ) {
      const existingWithSameModel =
        await this.productRepository.countByModelName(updateData.modelName);
      if (existingWithSameModel > 0) {
        throw this.errorHandlingService.returnErrorOnConflict(
          `[ERR_PROD_UPDATE_MODEL_CONFLICT] Model ${updateData.modelName} already exists`,
          "A product with this model already exists",
        );
      }
    }

    try {
      // If updating quantity, add to existing quantity instead of replacing
      if (updateData.quantity !== undefined) {
        if (updateData.quantity < 0) {
          throw this.errorHandlingService.returnErrorOnBadRequest(
            `[ERR_PROD_UPDATE_NEGATIVE_QTY] Negative quantity: ${updateData.quantity}`,
            "Quantity cannot be negative",
          );
        }
        updateData.quantity =
          (existingProduct.quantity || 0) + updateData.quantity;
      }

      const updatedProduct = await this.productRepository.update(
        id,
        updateData,
      );

      if (!updatedProduct) {
        throw this.errorHandlingService.returnErrorOnInternalServerError(
          "[ERR_PROD_UPDATE_CRITICAL] Critical error: Failed to update product",
          "Failed to update product",
        );
      }

      // Invalidate relevant caches
      const cacheDeletions = [
        this.cacheService.delete(`products:findOne:${id}`),
        this.cacheService.delete("products:list"),
      ];

      // Invalidate model and name caches if those fields were updated
      if (updateData.modelName) {
        cacheDeletions.push(
          this.cacheService.delete(
            `products:count:model:${existingProduct.modelName}`,
          ),
        );
        cacheDeletions.push(
          this.cacheService.delete(
            `products:count:model:${updateData.modelName}`,
          ),
        );
      }
      if (updateData.name) {
        cacheDeletions.push(
          this.cacheService.delete(
            `products:count:name:${existingProduct.name}`,
          ),
        );
        cacheDeletions.push(
          this.cacheService.delete(`products:count:name:${updateData.name}`),
        );
      }

      await Promise.all(cacheDeletions);

      this.logger.log({
        message: `Product ${id} updated successfully`,
        updatedFields: Object.keys(updateData),
      });
      return updatedProduct;
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_PROD_UPDATE_CRITICAL] Critical error: ${error?.message}`,
        "An error occurred while updating the product",
      );
    }
  }

  /**
   * Updates the stock for a product by adding a quantity.
   * @param id - The ID of the product to update.
   * @param quantity - The quantity to add to the stock.
   * @returns The updated product.
   * @deprecated Use update() method instead
   */
  async updateStock(id: string, quantity: number): Promise<Product> {
    return this.update(id, { quantity });
  }

  /**
   * Gets all products for a given model name.
   * @param modelName - The model name to search for.
   * @returns A list of products.
   */
  async getProductsByModelName(modelName: string): Promise<Product[]> {
    this.logger.log({
      message: `Fetching products by model name: ${modelName}`,
    });
    try {
      const products = await this.productRepository.findByModelName(modelName);
      this.logger.log({
        message: `Found ${products.length} products for model ${modelName}`,
      });
      return products;
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_PROD_GET_PRODUCTS_BY_MODEL_NAME] Error getting products by model name: ${error.message}`,
        "An error occurred while getting the products by model name",
      );
    }
  }

  /**
   * Gets all products for a given name.
   * @param name - The name to search for.
   * @returns A list of products.
   */
  async getProductsByName(name: string): Promise<Product[]> {
    this.logger.log({ message: `Fetching products by name: ${name}` });
    try {
      const products = await this.productRepository.findByName(name);
      this.logger.log({
        message: `Found ${products.length} products for name ${name}`,
      });
      return products;
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_PROD_GET_PRODUCTS_BY_NAME] Error getting products by name: ${error.message}`,
        "An error occurred while getting the products by name",
      );
    }
  }

  /**
   * Counts products by model name.
   * @param modelName - The model name to count.
   * @returns The number of products.
   */
  async countProductsByModelName(
    modelName: string,
  ): Promise<{ count: number }> {
    this.logger.log({
      message: `Counting products by model name: ${modelName}`,
    });
    try {
      const cacheKey = `products:count:model:${modelName}`;
      const count = await this.cacheService.getOrSet(
        cacheKey,
        async () => {
          return await this.productRepository.countByModelName(modelName);
        },
        { ttl: 3600 }, // 1 hour cache for model counts
      );
      this.logger.log({ message: `Count for model ${modelName}: ${count}` });
      return { count };
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_PROD_COUNT_PRODUCTS_BY_MODEL_NAME] Error counting products by model name: ${error.message}`,
        "An error occurred while counting the products by model name",
      );
    }
  }

  /**
   * Counts products by name.
   * @param name - The name to count.
   * @returns The number of products.
   */
  async countProductsByName(name: string): Promise<{ count: number }> {
    this.logger.log({ message: `Counting products by name: ${name}` });
    try {
      const cacheKey = `products:count:name:${name}`;
      const count = await this.cacheService.getOrSet(
        cacheKey,
        async () => {
          return await this.productRepository.countByName(name);
        },
        { ttl: 3600 }, // 1 hour cache for name counts
      );
      this.logger.log({ message: `Count for name ${name}: ${count}` });
      return { count };
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_PROD_COUNT_PRODUCTS_BY_NAME] Error counting products by name: ${error.message}`,
        "An error occurred while counting the products by name",
      );
    }
  }

  /**
   * Removes a product by its ID.
   * @param id - The ID of the product to remove.
   */
  async remove(id: string): Promise<void> {
    this.logger.log({ message: `Attempting to remove product ${id}` });
    const product = await this.getProductById(id); // Using cached version
    if (!product) {
      throw this.errorHandlingService.returnErrorOnNotFound(
        `[ERR_PROD_REMOVE_NOT_FOUND] Product ${id} not found`,
        "Product not found",
      );
    }

    try {
      await this.productRepository.delete(id);

      // Invalidate all related caches
      await Promise.all([
        this.cacheService.delete(`products:findOne:${id}`),
        this.cacheService.delete("products:list"),
        this.cacheService.delete(`products:count:model:${product.modelName}`),
        this.cacheService.delete(`products:count:name:${product.name}`),
      ]);

      this.logger.log({ message: `Product ${id} removed successfully` });
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_PROD_REMOVE_CRITICAL] Critical error: ${error.message}`,
        "Failed to delete product",
      );
    }
  }

  /**
   * Gets a summary of stock quantities grouped by product model
   * @returns An array of objects containing model name and total quantity in stock
   */
  async getStockSummaryByModel(): Promise<{
    totalProducts: number;
    stockSummary: { modelName: string; totalQuantity: number }[];
    modelsCount: number;
    outOfStockCount: number;
    lowStockCount: number;
  }> {
    this.logger.log({ message: "Fetching stock summary by model" });

    const cacheKey = "products:stock-summary-by-model";

    try {
      return await this.cacheService.getOrSet(
        cacheKey,
        async () => {
          const [total, products] = await Promise.all([
            this.getTotalStock(),
            this.productRepository.findAll(),
          ]);

          // Group by model and calculate quantities
          const modelStock = new Map<string, number>();
          products.forEach((product) => {
            const currentQuantity = modelStock.get(product.modelName) || 0;
            modelStock.set(
              product.modelName,
              currentQuantity + product.quantity,
            );
          });

          const stockSummary = Array.from(modelStock.entries())
            .map(([modelName, totalQuantity]) => ({
              modelName,
              totalQuantity,
            }))
            .sort((a, b) => a.modelName.localeCompare(b.modelName));

          const modelsCount = stockSummary.length;
          const outOfStockCount = stockSummary.filter(
            (item) => item.totalQuantity === 0,
          ).length;
          const lowStockCount = stockSummary.filter(
            (item) => item.totalQuantity > 0 && item.totalQuantity <= 5,
          ).length;

          return {
            totalProducts: total.count,
            stockSummary,
            modelsCount,
            outOfStockCount,
            lowStockCount,
          };
        },
        { ttl: 300 }, // Cache for 5 minutes
      );
    } catch (error) {
      this.logger.error(
        `[ERR_PROD_GET_STOCK_SUMMARY] Error: ${error.message}`,
        {
          stack: error.stack,
        },
      );
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_PROD_GET_STOCK_SUMMARY] Error getting stock summary: ${error.message}`,
        "An error occurred while fetching stock summary by model",
      );
    }
  }
}
