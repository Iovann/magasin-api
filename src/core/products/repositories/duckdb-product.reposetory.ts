import { DuckDBInstance, DuckDBConnection } from '@duckdb/node-api';
import { join } from 'path';
import { Injectable, Logger } from '@nestjs/common';
import { IProductRepository } from './product.repository';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { DatabaseConfig } from '../../../config/database.config';

interface ProductWithTimestamps extends Product {
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class DuckDBProductRepository implements IProductRepository {
  private instance: DuckDBInstance;
  private connection: DuckDBConnection;
  private readonly logger = new Logger(DuckDBProductRepository.name);
  private readonly tableName = 'products';
  private isInitialized = false;
  private initPromise: Promise<void>;

  constructor(private readonly config: DatabaseConfig) {
    this.initPromise = this.init();
  }

  private async waitForInitialization(): Promise<void> {
    if (!this.isInitialized) {
      await this.initPromise;
    }
  }

  private async init(): Promise<void> {
    const dbPath = join(process.cwd(), this.config.dbPath, 'products.duckdb');
    this.instance = await DuckDBInstance.create(dbPath);
    this.connection = await this.instance.connect();
    await this.initializeDatabase();
  }

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
      this.logger.log('DuckDB products table initialized successfully');
      this.isInitialized = true;
    } catch (err) {
      this.logger.error('Failed to initialize products database', err);
      throw err;
    }
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    await this.waitForInitialization();
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
          newProduct.updatedAt.toISOString()
        ]
      );
      return newProduct;
    } catch (err) {
      this.logger.error('Failed to create product', err);
      throw err;
    }
  }

  private async queryAll(sql: string, params: any[] = []): Promise<any[]> {
    const result = await this.connection.runAndReadAll(sql, params);
    return result.getRowObjectsJS();
  }

  private async queryOne(sql: string, params: any[] = []): Promise<any> {
    const result = await this.connection.runAndReadAll(sql, params);
    const rows = result.getRowObjectsJS();
    return rows[0] || null;
  }

  async findById(id: string): Promise<Product | null> {
    await this.waitForInitialization();

    try {
      const row = await this.queryOne(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      return row ? this.mapRowToProduct(row) : null;
    } catch (err) {
      this.logger.error('Failed to find product by id', err);
      throw err;
    }
  }

  async findAll(): Promise<Product[]> {
    await this.waitForInitialization();
    try {
      const rows = await this.queryAll(`SELECT * FROM ${this.tableName}`);
      return rows.map(row => this.mapRowToProduct(row));
    } catch (err) {
      this.logger.error('Failed to find all products', err);
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    await this.waitForInitialization();
    try {
      await this.connection.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    } catch (err) {
      this.logger.error('Failed to delete product', err);
      throw err;
    }
  }

  async count(): Promise<number> {
    try {
      const row = await this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName}`);
      return parseInt(row.count, 10);
    } catch (err) {
      this.logger.error('Failed to count products', err);
      throw err;
    }
  }

  async countByModelName(modelName: string): Promise<number> {
    try {
      const row = await this.queryOne(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE modelName = ?`,
        [modelName]
      );
      return parseInt(row.count, 10);
    } catch (err) {
      this.logger.error('Failed to count products by model name', err);
      throw err;
    }
  }

  async countByName(name: string): Promise<number> {
    try {
      const row = await this.queryOne(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE name = ?`,
        [name]
      );
      return parseInt(row.count, 10);
    } catch (err) {
      this.logger.error('Failed to count products by name', err);
      throw err;
    }
  }

  async update(id: string, updateProductDto: Partial<CreateProductDto>): Promise<Product | null> {
    await this.waitForInitialization();
    const updates: string[] = [];
    const params: any[] = [];

    if (updateProductDto.name !== undefined) { 
      updates.push('name = ?'); 
      params.push(updateProductDto.name); 
    }
    if (updateProductDto.modelName !== undefined) { 
      updates.push('modelName = ?'); 
      params.push(updateProductDto.modelName); 
    }
    if (updateProductDto.price !== undefined) { 
      updates.push('price = ?'); 
      params.push(updateProductDto.price); 
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    try {
      await this.connection.run(
        `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      return await this.findById(id);
    } catch (err) {
      this.logger.error('Failed to update product', err);
      throw err;
    }
  }

  async findByModelName(modelName: string): Promise<Product[]> {
    try {
      const rows = await this.queryAll(
        `SELECT * FROM ${this.tableName} WHERE modelName = ?`,
        [modelName]
      );
      return rows.map(row => this.mapRowToProduct(row));
    } catch (err) {
      this.logger.error('Failed to find products by model name', err);
      throw err;
    }
  }

  async findByName(name: string): Promise<Product[]> {
    try {
      const rows = await this.queryAll(
        `SELECT * FROM ${this.tableName} WHERE name = ?`,
        [name]
      );
      return rows.map(row => this.mapRowToProduct(row));
    } catch (err) {
      this.logger.error('Failed to find products by name', err);
      throw err;
    }
  }

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

  async onModuleDestroy(): Promise<void> {
    try {
      if (this.connection) {
        this.connection.closeSync();
      }
      if (this.instance) {
        this.instance.closeSync();
      }
    } catch (err) {
      this.logger.error('Failed to close DuckDB connections', err);
    }
  }
}