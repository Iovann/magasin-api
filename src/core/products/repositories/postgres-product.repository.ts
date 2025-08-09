import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IProductRepository } from "./product.repository";
import { PostgresProduct } from "../entities/postgres-product.entity";
import { CreateProductDto } from "../dto/create-product.dto";
import { Product } from "../entities/product.entity";
import { UpdateProductDto } from "../dto/update-product.dto";

@Injectable()
export class PostgresProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(PostgresProduct)
    private readonly productRepository: Repository<PostgresProduct>,
  ) {}

  /**
   * Creates a new product in PostgreSQL.
   * @param productDto - The data to create the product.
   * @returns The created product.
   */
  async create(productDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(productDto);
    return this.productRepository.save(product);
  }

  /**
   * Finds a product by its ID in PostgreSQL.
   * @param id - The ID of the product.
   * @returns The product or null if not found.
   */
  async findById(id: string): Promise<Product | null> {
    return this.productRepository.findOneBy({ id });
  }

  /**
   * Finds all products in PostgreSQL.
   * @returns A list of all products.
   */
  async findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  /**
   * Deletes a product by its ID from PostgreSQL.
   * @param id - The ID of the product to delete.
   */
  async delete(id: string): Promise<void> {
    await this.productRepository.delete(id);
  }

  /**
   * Counts the total number of products in PostgreSQL.
   * @returns The total number of products.
   */
  async count(): Promise<number> {
    return this.productRepository.count();
  }

  /**
   * Counts the number of products by model name in PostgreSQL.
   * @param modelName - The model name to search for.
   * @returns The number of products with the given model name.
   */
  async countByModelName(modelName: string): Promise<number> {
    return this.productRepository.count({ where: { modelName } });
  }

  /**
   * Counts the number of products by name in PostgreSQL.
   * @param name - The name to search for.
   * @returns The number of products with the given name.
   */
  async countByName(name: string): Promise<number> {
    return this.productRepository.count({ where: { name } });
  }

  /**
   * Updates a product in PostgreSQL.
   * @param id - The ID of the product to update.
   * @param updateData - The data to update the product with.
   * @returns The updated product or null if not found.
   */
  async update(
    id: string,
    updateData: UpdateProductDto,
  ): Promise<Product | null> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      return null;
    }
    Object.assign(product, updateData);
    return this.productRepository.save(product);
  }

  /**
   * Finds products by model name in PostgreSQL.
   * @param modelName - The model name to search for.
   * @returns A list of products with the given model name.
   */
  async findByModelName(modelName: string): Promise<Product[]> {
    return this.productRepository.find({ where: { modelName } });
  }

  /**
   * Finds products by name in PostgreSQL.
   * @param name - The name to search for.
   * @returns A list of products with the given name.
   */
  async findByName(name: string): Promise<Product[]> {
    return this.productRepository.find({ where: { name } });
  }
}
