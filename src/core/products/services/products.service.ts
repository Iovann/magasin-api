import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateProductDto } from "../dto/create-product.dto";
import { IProductRepository } from "../repositories/product.repository";
import { Product } from "../entities/product.entity";

/**
 * Service for handling product-related operations.
 */
@Injectable()
export class ProductsService {
  constructor(private readonly productRepository: IProductRepository) {}

  /**
   * Creates a new product.
   * @param createProductDto - The data to create the product.
   * @returns The created product.
   * @throws {ConflictException} If a product with the same model name or name already exists.
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const existingProductByModelName =
      await this.productRepository.countByModelName(createProductDto.modelName);
    if (existingProductByModelName > 0) {
      throw new ConflictException(
        `A product with the model ${createProductDto.modelName} already exists`,
      );
    }

    const existingProductByName = await this.productRepository.countByName(
      createProductDto.name,
    );
    if (existingProductByName > 0) {
      throw new ConflictException(
        `A product with the name ${createProductDto.name} already exists`,
      );
    }
    return this.productRepository.create(createProductDto);
  }

  /**
   * Gets the total number of products.
   * @returns The total number of products.
   */
  async getTotalStock(): Promise<number> {
    return await this.productRepository.count();
  }

  /**
   * Gets all products.
   * @returns A list of all products.
   */
  async getAllProducts(): Promise<Product[]> {
    return await this.productRepository.findAll();
  }

  /**
   * Gets a product by its ID.
   * @param id - The ID of the product.
   * @returns The product or null if not found.
   */
  async getProductById(id: string): Promise<Product | null> {
    return await this.productRepository.findById(id);
  }

  /**
   * Gets the stock count for a specific model.
   * @param modelName - The model name to search for.
   * @returns The number of products for the given model name.
   */
  async getStockByModel(modelName: string): Promise<number> {
    return this.productRepository.countByModelName(modelName);
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
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    if (product.quantity < quantity) {
      throw new BadRequestException(
        `Insufficient quantity in stock for product ${product.name}. Current stock: ${product.quantity}`,
      );
    }
    const updatedProduct = await this.productRepository.update(id, {
      quantity: product.quantity - quantity,
    });

    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return updatedProduct;
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
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (quantity < 0) {
      throw new BadRequestException(`Quantity cannot be negative`);
    }

    const newQuantity = product.quantity + quantity;
    const updatedProduct = await this.productRepository.update(id, {
      quantity: newQuantity,
    });

    if (!updatedProduct) {
      throw new NotFoundException(
        `Product with ID ${id} not found during update`,
      );
    }
    return updatedProduct;
  }

  /**
   * Gets all products for a given model name.
   * @param modelName - The model name to search for.
   * @returns A list of products.
   */
  async getProductsByModelName(modelName: string): Promise<Product[]> {
    return this.productRepository.findByModelName(modelName);
  }

  /**
   * Gets all products for a given name.
   * @param name - The name to search for.
   * @returns A list of products.
   */
  async getProductsByName(name: string): Promise<Product[]> {
    return this.productRepository.findByName(name);
  }

  /**
   * Counts products by model name.
   * @param modelName - The model name to count.
   * @returns The number of products.
   */
  async countProductsByModelName(modelName: string): Promise<number> {
    return this.productRepository.countByModelName(modelName);
  }

  /**
   * Counts products by name.
   * @param name - The name to count.
   * @returns The number of products.
   */
  async countProductsByName(name: string): Promise<number> {
    return this.productRepository.countByName(name);
  }

  /**
   * Removes a product by its ID.
   * @param id - The ID of the product to remove.
   */
  async remove(id: string): Promise<void> {
    await this.productRepository.delete(id);
  }
}
