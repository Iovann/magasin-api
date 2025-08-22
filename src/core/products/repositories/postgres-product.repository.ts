import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IProductRepository } from "./product.repository";
import { PostgresProduct } from "../entities/postgres-product.entity";
import { CreateProductDto } from "../dto/create-product.dto";
import { Product } from "../entities/product.entity";

@Injectable()
export class PostgresProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(PostgresProduct)
    private readonly productRepository: Repository<PostgresProduct>,
  ) {}

  /**
   * Creates a new product.
   * @param productDto - The data for the new product.
   * @returns The created product.
   */
  async create(productDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(productDto);
    return this.productRepository.save(product);
  }

  /**
   * Retrieves a product by its unique ID.
   * @param id - The unique ID of the product.
   * @returns The product with the specified ID.
   */
  async findById(id: string): Promise<Product | null> {
    return this.productRepository.findOneBy({ id });
  }

  /**
   * Retrieves all products.
   * @returns An array of products.
   */
  async findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  /**
   * Deletes a product by its unique ID.
   * @param id - The unique ID of the product to delete.
   */
  async delete(id: string): Promise<void> {
    await this.productRepository.delete(id);
  }

  /**
   * Retrieves the total count of all products.
   * @returns The total count of all products.
   */
  async count(): Promise<number> {
    return this.productRepository.count();
  }

  /**
   * Retrieves the count of products by model name.
   * @param modelName - The model name to filter by.
   * @returns The count of products with the specified model name.
   */
  async countByModelName(modelName: string): Promise<number> {
    return this.productRepository.count({ where: { modelName } });
  }

  /**
   * Retrieves the count of products by name.
   * @param name - The name to filter by.
   * @returns The count of products with the specified name.
   */
  async countByName(name: string): Promise<number> {
    return this.productRepository.count({ where: { name } });
  }

  /**
   * Updates a product by its unique ID.
   * @param id - The unique ID of the product to update.
   * @param updateData - The data to update the product.
   * @returns The updated product.
   */
  async update(
    id: string,
    updateData: Partial<Product>,
  ): Promise<Product | null> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      return null;
    }
    Object.assign(product, updateData);
    return this.productRepository.save(product);
  }

  /**
   * Retrieves products by model name.
   * @param modelName - The model name to filter by.
   * @returns An array of products with the specified model name.
   */
  async findByModelName(modelName: string): Promise<Product[]> {
    return this.productRepository.find({ where: { modelName } });
  }

  /**
   * Retrieves products by name.
   * @param name - The name to filter by.
   * @returns An array of products with the specified name.
   */
  async findByName(name: string): Promise<Product[]> {
    return this.productRepository.find({ where: { name } });
  }
}
