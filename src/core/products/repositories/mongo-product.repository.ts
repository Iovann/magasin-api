import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IProductRepository } from "./product.repository";
import { MongoProduct } from "../entities/mongo-product.entity";
import { CreateProductDto } from "../dto/create-product.dto";
import { Product } from "../entities/product.entity";
import { UpdateProductDto } from "../dto/update-product.dto";
import { NotFoundException } from "@nestjs/common";

@Injectable()
export class MongoProductRepository implements IProductRepository {
  constructor(
    @InjectModel(MongoProduct.name)
    private readonly productModel: Model<MongoProduct>,
  ) {}

  /**
   * Creates a new product in MongoDB.
   * @param productDto - The data to create the product.
   * @returns The created product.
   */
  async create(productDto: CreateProductDto): Promise<Product> {
    const newProduct = new this.productModel(productDto);
    return newProduct.save();
  }

  /**
   * Finds a product by its ID in MongoDB.
   * @param id - The ID of the product.
   * @returns The product or null if not found.
   */
  async findById(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
  }

  /**
   * Finds all products in MongoDB.
   * @returns A list of all products.
   */
  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  /**
   * Deletes a product by its ID from MongoDB.
   * @param id - The ID of the product to delete.
   */
  async delete(id: string): Promise<void> {
    await this.productModel.findByIdAndDelete(id).exec();
  }

  /**
   * Counts the total number of products in MongoDB.
   * @returns The total number of products.
   */
  async count(): Promise<number> {
    return this.productModel.countDocuments().exec();
  }

  /**
   * Counts the number of products by model name in MongoDB.
   * @param modelName - The model name to search for.
   * @returns The number of products with the given model name.
   */
  async countByModelName(modelName: string): Promise<number> {
    return this.productModel.countDocuments({ modelName }).exec();
  }

  /**
   * Counts the number of products by name in MongoDB.
   * @param name - The name to search for.
   * @returns The number of products with the given name.
   */
  async countByName(name: string): Promise<number> {
    return this.productModel.countDocuments({ name }).exec();
  }

  /**
   * Updates a product in MongoDB.
   * @param id - The ID of the product to update.
   * @param updateProductDto - The data to update the product with.
   * @returns The updated product.
   * @throws {NotFoundException} If the product with the given ID is not found.
   */
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    if (updateProductDto.quantity !== undefined) {
      product.quantity = updateProductDto.quantity;
    }
    if (updateProductDto.price !== undefined) {
      product.price = updateProductDto.price;
    }
    return product.save();
  }

  /**
   * Finds products by model name in MongoDB.
   * @param modelName - The model name to search for.
   * @returns A list of products with the given model name.
   */
  async findByModelName(modelName: string): Promise<Product[]> {
    return this.productModel.find({ modelName }).exec();
  }

  /**
   * Finds products by name in MongoDB.
   * @param name - The name to search for.
   * @returns A list of products with the given name.
   */
  async findByName(name: string): Promise<Product[]> {
    return this.productModel.find({ name }).exec();
  }
}
