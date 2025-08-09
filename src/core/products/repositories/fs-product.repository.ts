import { Injectable, OnModuleInit } from "@nestjs/common";
import { promises as fs } from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { IProductRepository } from "./product.repository";
import { CreateProductDto } from "../dto/create-product.dto";
import { Product } from "../entities/product.entity";
import { DatabaseConfig } from "../../../config/database.config";
import { UpdateProductDto } from "../dto/update-product.dto";

@Injectable()
export class FsProductRepository implements IProductRepository, OnModuleInit {
  private dbPath: string;
  private data: Product[] = [];

  constructor(private readonly dbConfig: DatabaseConfig) {
    // We get the path from the injected config
    this.dbPath = path.resolve(this.dbConfig.dbPath, "products.json");
  }

  async onModuleInit() {
    await this.loadData();
  }

  /**
   * Loads data from the JSON file.
   * Creates the file if it does not exist.
   * @private
   */
  private async loadData(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      const fileContent = await fs.readFile(this.dbPath, "utf-8");
      this.data = JSON.parse(fileContent);
    } catch (error) {
      if (error.code === "ENOENT") {
        // File doesn't exist, initialize with empty array
        this.data = [];
        await this.persist();
      } else {
        throw error;
      }
    }
  }

  /**
   * Writes the current data to the JSON file.
   * @private
   */
  private async persist(): Promise<void> {
    await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
  }

  /**
   * Creates a new product.
   * @param productDto - The data to create the product.
   * @returns The created product.
   */
  async create(productDto: CreateProductDto): Promise<Product> {
    const newProduct: Product = {
      id: randomUUID(),
      ...productDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.push(newProduct);
    await this.persist();
    return newProduct;
  }

  /**
   * Finds a product by its ID.
   * @param id - The ID of the product.
   * @returns The product or null if not found.
   */
  async findById(id: string): Promise<Product | null> {
    return this.data.find((p) => p.id === id) || null;
  }

  /**
   * Finds all products.
   * @returns A list of all products.
   */
  async findAll(): Promise<Product[]> {
    return [...this.data];
  }

  /**
   * Deletes a product by its ID.
   * @param id - The ID of the product to delete.
   */
  async delete(id: string): Promise<void> {
    const initialLength = this.data.length;
    this.data = this.data.filter((p) => p.id !== id);
    if (this.data.length < initialLength) {
      await this.persist();
    }
  }

  /**
   * Counts the total number of products.
   * @returns The total number of products.
   */
  async count(): Promise<number> {
    return this.data.length;
  }

  /**
   * Counts the number of products by model name.
   * @param modelName - The model name to search for.
   * @returns The number of products with the given model name.
   */
  async countByModelName(modelName: string): Promise<number> {
    return this.data.filter((p) => p.modelName === modelName).length;
  }

  /**
   * Counts the number of products by name.
   * @param name - The name to search for.
   * @returns The number of products with the given name.
   */
  async countByName(name: string): Promise<number> {
    return this.data.filter((p) => p.name === name).length;
  }

  /**
   * Updates a product.
   * @param id - The ID of the product to update.
   * @param updateData - The data to update the product with.
   * @returns The updated product or null if not found.
   */
  async update(
    id: string,
    updateData: UpdateProductDto,
  ): Promise<Product | null> {
    const index = this.data.findIndex((p) => p.id === id);
    if (index === -1) {
      return null;
    }

    this.data[index] = {
      ...this.data[index],
      ...updateData,
      updatedAt: new Date(),
    };
    await this.persist();
    return this.data[index];
  }

  /**
   * Finds products by model name.
   * @param modelName - The model name to search for.
   * @returns A list of products with the given model name.
   */
  async findByModelName(modelName: string): Promise<Product[]> {
    return this.data.filter((p) => p.modelName === modelName);
  }

  /**
   * Finds products by name.
   * @param name - The name to search for.
   * @returns A list of products with the given name.
   */
  async findByName(name: string): Promise<Product[]> {
    return this.data.filter((p) => p.name === name);
  }
}
