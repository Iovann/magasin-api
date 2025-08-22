import { DuckDBConnection } from "@duckdb/node-api";
import { Injectable, Logger } from "@nestjs/common";
import { IProductRepository } from "./product.repository";
import { Product } from "../entities/product.entity";
import { CreateProductDto } from "../dto/create-product.dto";
import { DuckDBService } from "../../../libs/database/duckdb.service";

interface ProductWithTimestamps extends Product {
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class DuckDBProductRepository implements IProductRepository {
  private connection: DuckDBConnection;
  private readonly logger = new Logger(DuckDBProductRepository.name);
  private readonly tableName = "products";

  constructor(private readonly duckDBService: DuckDBService) {}

  async onModuleInit() {
    this.connection = await this.duckDBService.getConnection();
    await this.initializeDatabase();
  }

  /**
   * Initializes the DuckDB database by creating the products table if it doesn't exist.
   */
  private async initializeDatabase(): Promise<void> {
    try {
      await this.connection.run(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          modelName TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10,2),
          quantity INTEGER DEFAULT 0,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      this.logger.log("DuckDB products table initialized successfully");
    } catch (err) {
      this.logger.error("Failed to initialize products database", err);
      throw err;
    }
  }

  /**
   * Creates a new product in the DuckDB database.
   * @param createProductDto - The data for the new product.
   * @returns The created product.
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const id = crypto.randomUUID();
    const now = new Date();
    const newProduct: ProductWithTimestamps = {
      ...createProductDto,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await this.connection.run(
        `INSERT INTO ${this.tableName} (id, name, modelName, price, quantity, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          newProduct.id,
          newProduct.name,
          newProduct.modelName,
          newProduct.price || null,
          newProduct.quantity || null,
          newProduct.createdAt.toISOString(),
          newProduct.updatedAt.toISOString(),
        ],
      );
      return newProduct;
    } catch (err) {
      this.logger.error("Failed to create product", err);
      throw err;
    }
  }

  /**
   * Executes a query and returns all rows as an array.
   * @param sql - The SQL query to execute.
   * @param params - The parameters for the query.
   * @returns An array of rows returned by the query.
   */
  private async queryAll(sql: string, params: any[] = []): Promise<any[]> {
    const result = await this.connection.runAndReadAll(sql, params);
    return result.getRowObjectsJS();
  }

  /**
   * Executes a query and returns the first row.
   * @param sql - The SQL query to execute.
   * @param params - The parameters for the query.
   * @returns The first row returned by the query, or null if no rows are returned.
   */
  private async queryOne(sql: string, params: any[] = []): Promise<any> {
    const result = await this.connection.runAndReadAll(sql, params);
    const rows = result.getRowObjectsJS();
    return rows[0] || null;
  }

  /**
   * Retrieves a product by its unique ID.
   * @param id - The unique ID of the product.
   * @returns The product with the specified ID, or null if not found.
   */
  async findById(id: string): Promise<Product | null> {
    try {
      const row = await this.queryOne(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id],
      );
      return row ? this.mapRowToProduct(row) : null;
    } catch (err) {
      this.logger.error("Failed to find product by id", err);
      throw err;
    }
  }

  /**
   * Retrieves all products from the database.
   * @returns An array of products.
   */
  async findAll(): Promise<Product[]> {
    try {
      const rows = await this.queryAll(`SELECT * FROM ${this.tableName}`);
      return rows.map((row) => this.mapRowToProduct(row));
    } catch (err) {
      this.logger.error("Failed to find all products", err);
      throw err;
    }
  }

  /**
   * Deletes a product by its unique ID.
   * @param id - The unique ID of the product to delete.
   */
  async delete(id: string): Promise<void> {
    try {
      await this.connection.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [
        id,
      ]);
    } catch (err) {
      this.logger.error("Failed to delete product", err);
      throw err;
    }
  }

  /**
   * Retrieves the total count of all products.
   * @returns The total count of all products.
   */
  async count(): Promise<number> {
    try {
      const row = await this.queryOne(
        `SELECT COUNT(*) as count FROM ${this.tableName}`,
      );
      return parseInt(row.count, 10);
    } catch (err) {
      this.logger.error("Failed to count products", err);
      throw err;
    }
  }

  /**
   * Retrieves the count of products by model name.
   * @param modelName - The model name to filter by.
   * @returns The count of products with the specified model name.
   */
  async countByModelName(modelName: string): Promise<number> {
    try {
      const row = await this.queryOne(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE modelName = ?`,
        [modelName],
      );
      return parseInt(row.count, 10);
    } catch (err) {
      this.logger.error("Failed to count products by model name", err);
      throw err;
    }
  }

  /**
   * Retrieves the count of products by name.
   * @param name - The name to filter by.
   * @returns The count of products with the specified name.
   */
  async countByName(name: string): Promise<number> {
    try {
      const row = await this.queryOne(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE name = ?`,
        [name],
      );
      return parseInt(row.count, 10);
    } catch (err) {
      this.logger.error("Failed to count products by name", err);
      throw err;
    }
  }

  /**
   * Updates a product by its unique ID.
   * @param id - The unique ID of the product to update.
   * @param updateProductDto - The data to update the product.
   * @returns The updated product.
   */
  async update(
    id: string,
    updateProductDto: Partial<CreateProductDto>,
  ): Promise<Product | null> {
    const updates: string[] = [];
    const params: any[] = [];

    if (updateProductDto.name !== undefined) {
      updates.push("name = ?");
      params.push(updateProductDto.name);
    }
    if (updateProductDto.modelName !== undefined) {
      updates.push("modelName = ?");
      params.push(updateProductDto.modelName);
    }
    if (updateProductDto.price !== undefined) {
      updates.push("price = ?");
      params.push(updateProductDto.price);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push("updatedAt = ?");
    params.push(new Date().toISOString());
    params.push(id);

    try {
      await this.connection.run(
        `UPDATE ${this.tableName} SET ${updates.join(", ")} WHERE id = ?`,
        params,
      );
      return await this.findById(id);
    } catch (err) {
      this.logger.error("Failed to update product", err);
      throw err;
    }
  }

  /**
   * Retrieves products by model name.
   * @param modelName - The model name to filter by.
   * @returns An array of products with the specified model name.
   */
  async findByModelName(modelName: string): Promise<Product[]> {
    try {
      const rows = await this.queryAll(
        `SELECT * FROM ${this.tableName} WHERE modelName = ?`,
        [modelName],
      );
      return rows.map((row) => this.mapRowToProduct(row));
    } catch (err) {
      this.logger.error("Failed to find products by model name", err);
      throw err;
    }
  }

  /**
   * Retrieves products by name.
   * @param name - The name to filter by.
   * @returns An array of products with the specified name.
   */
  async findByName(name: string): Promise<Product[]> {
    try {
      const rows = await this.queryAll(
        `SELECT * FROM ${this.tableName} WHERE name = ?`,
        [name],
      );
      return rows.map((row) => this.mapRowToProduct(row));
    } catch (err) {
      this.logger.error("Failed to find products by name", err);
      throw err;
    }
  }

  /**
   * Maps a row from the database to a Product object.
   * @param row - The row to map.
   * @returns The mapped Product object.
   */
  private mapRowToProduct(row: any): ProductWithTimestamps {
    return {
      id: row.id,
      name: row.name,
      modelName: row.modelName,
      price: parseFloat(row.price),
      quantity: row.quantity,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  /**
   * Closes the DuckDB connection when the module is destroyed.
   */
  async onModuleDestroy(): Promise<void> {
    try {
      if (this.connection) {
        this.connection.closeSync();
      }
    } catch (err) {
      this.logger.error("Failed to close DuckDB connection", err);
    }
  }
}
