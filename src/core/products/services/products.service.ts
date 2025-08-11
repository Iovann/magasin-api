import { Injectable, Inject } from "@nestjs/common";
import { CreateProductDto } from "../dto/create-product.dto";
import { IProductRepository } from "../repositories/product.repository";
import { Product } from "../entities/product.entity";
import { ErrorHandlingService } from "../../../common/response/error-handling";
import { DataSource, EntityManager } from "typeorm";
import { Connection, ClientSession } from "mongoose";
import { InjectConnection } from "@nestjs/mongoose";

type TransactionalOperation<T> = (
  repo: IProductRepository,
  session?: ClientSession | EntityManager,
) => Promise<T>;

/**
 * Service for handling product-related operations.
 */
@Injectable()
export class ProductsService {
  constructor(
    @Inject(IProductRepository)
    private readonly productRepository: IProductRepository,
    private readonly errorHandlingService: ErrorHandlingService,
    private readonly dataSource: DataSource,
    @InjectConnection() private readonly mongooseConnection: Connection,
  ) {}

  private async withTransaction<T>(
    operation: TransactionalOperation<T>,
  ): Promise<T> {
    // Check the type of repository to determine the database type
    if (
      this.productRepository.constructor.name === "PostgresProductRepository"
    ) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        const result = await operation(
          this.productRepository,
          queryRunner.manager,
        );
        await queryRunner.commitTransaction();
        return result;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } else if (
      this.productRepository.constructor.name === "MongoProductRepository"
    ) {
      const session = await this.mongooseConnection.startSession();
      session.startTransaction();
      try {
        const result = await operation(this.productRepository, session);
        await session.commitTransaction();
        return result;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      // For FSProductRepository or other types, execute without transaction
      return operation(this.productRepository);
    }
  }

  /**
   * Creates a new product.
   * @param createProductDto - The data to create the product.
   * @returns The created product.
   * @throws {ConflictException} If a product with the same model name or name already exists.
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    return this.withTransaction(async (repo, session) => {
      // 1. Verification of duplicates
      const existingProductByModelName = await repo.countByModelName(
        createProductDto.modelName,
        session,
      );
      if (existingProductByModelName > 0) {
        throw this.errorHandlingService.returnErrorOnConflict(
          `[ERR_PROD_CREATE_MODEL_CONFLICT] Model ${createProductDto.modelName} already exists`,
          "A product with this model already exists",
        );
      }

      const existingProductByName = await repo.countByName(
        createProductDto.name,
        session,
      );
      if (existingProductByName > 0) {
        throw this.errorHandlingService.returnErrorOnConflict(
          `[ERR_PROD_CREATE_NAME_CONFLICT] Name ${createProductDto.name} already exists`,
          "A product with this name already exists",
        );
      }

      // 2. Creation
      try {
        return await repo.create(createProductDto, session);
      } catch (error) {
        throw this.errorHandlingService.returnErrorOnInternalServerError(
          `[ERR_PROD_CREATE_CRITICAL] Critical error: ${error.message}`,
          "Failed to create product",
        );
      }
    });
  }

  /**
   * Gets the total number of products.
   * @returns The total number of products.
   */
  async getTotalStock(): Promise<{ count: number }> {
    try {
      const count = await this.productRepository.count();
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
    try {
      return await this.productRepository.findAll();
    } catch (error) {
      throw this.errorHandlingService.returnErrorOnInternalServerError(
        `[ERR_PROD_GET_ALL_PRODUCTS] Error getting all products: ${error.message}`,
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
    try {
      return await this.productRepository.findById(id);
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
    try {
      const count = await this.productRepository.countByModelName(modelName);
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
    return this.withTransaction(async (repo, session) => {
      // 1. Validation of inputs
      if (quantity <= 0) {
        throw this.errorHandlingService.returnErrorOnBadRequest(
          `[ERR_PROD_SELL_INVALID_QTY] Invalid quantity: ${quantity}`,
          "The quantity must be positive",
        );
      }

      // 2. Product retrieval
      const product = await repo.findById(id, session);
      if (!product) {
        throw this.errorHandlingService.returnErrorOnNotFound(
          `[ERR_PROD_SELL_NOT_FOUND] Product ${id} not found`,
          "Product not found",
        );
      }

      // 3. Business validation
      if (product.quantity < quantity) {
        throw this.errorHandlingService.returnErrorOnBadRequest(
          `[ERR_PROD_SELL_INSUFFICIENT_STOCK] Insufficient stock for ${product.name}`,
          `Insufficient stock for ${product.name}. Available quantity: ${product.quantity}`,
        );
      }

      // 4. Stock update
      try {
        const updatedProduct = await repo.update(
          id,
          { quantity: product.quantity - quantity },
          session,
        );

        if (!updatedProduct) {
          throw this.errorHandlingService.returnErrorOnNotFound(
            `[ERR_PROD_UPDATE_FAILED] Failed to update product ${id}`,
            "Failed to update product",
          );
        }

        return updatedProduct;
      } catch (error) {
        throw this.errorHandlingService.returnErrorOnInternalServerError(
          `[ERR_PROD_SELL_CRITICAL] Critical error during sale: ${error.message}`,
          "An error occurred while processing the sale",
        );
      }
    });
  }

  /**
   * Updates the stock for a product by adding a quantity.
   * @param id - The ID of the product to update.
   * @param quantity - The quantity to add to the stock.
   * @returns The updated product.
   * @throws {NotFoundException} If the product is not found.
   * @throws {BadRequestException} If the quantity is negative.
   */
  async updateStock(id: string, quantity: number): Promise<Product> {
    return this.withTransaction(async (repo, session) => {
      // 1. Validation of inputs
      if (quantity < 0) {
        throw this.errorHandlingService.returnErrorOnBadRequest(
          `[ERR_PROD_UPDATE_NEGATIVE_QTY] Negative quantity: ${quantity}`,
          "Quantity cannot be negative",
        );
      }

      // 2. Product retrieval
      const product = await repo.findById(id, session);
      if (!product) {
        throw this.errorHandlingService.returnErrorOnNotFound(
          `[ERR_PROD_UPDATE_NOT_FOUND] Product ${id} not found`,
          "Product not found",
        );
      }

      // 3. Stock update
      try {
        const newQuantity = product.quantity + quantity;
        const updatedProduct = await repo.update(
          id,
          { quantity: newQuantity },
          session,
        );

        if (!updatedProduct) {
          throw new Error("Failed to update product stock");
        }

        return updatedProduct;
      } catch (error) {
        throw this.errorHandlingService.returnErrorOnInternalServerError(
          `[ERR_PROD_UPDATE_STOCK_CRITICAL] Critical error: ${error.message}`,
          "An error occurred while updating the stock",
        );
      }
    });
  }

  /**
   * Gets all products for a given model name.
   * @param modelName - The model name to search for.
   * @returns A list of products.
   */
  async getProductsByModelName(modelName: string): Promise<Product[]> {
    try {
      return await this.productRepository.findByModelName(modelName);
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
    try {
      return await this.productRepository.findByName(name);
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
    try {
      const count = await this.productRepository.countByModelName(modelName);
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
    try {
      const count = await this.productRepository.countByName(name);
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
    return this.withTransaction(async (repo, session) => {
      // Verification of product existance
      const product = await repo.findById(id, session);
      if (!product) {
        throw this.errorHandlingService.returnErrorOnNotFound(
          `[ERR_PROD_REMOVE_NOT_FOUND] Product ${id} not found`,
          "Product not found",
        );
      }

      // Then delete
      try {
        await repo.delete(id, session);
      } catch (error) {
        throw this.errorHandlingService.returnErrorOnInternalServerError(
          `[ERR_PROD_REMOVE_CRITICAL] Critical error: ${error.message}`,
          "Failed to delete product",
        );
      }
    });
  }
}
