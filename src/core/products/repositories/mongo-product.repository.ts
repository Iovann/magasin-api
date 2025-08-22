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
   * Creates a new product.
   * @param productDto - The data for the new product.
   * @returns The created product.
   */
  async create(productDto: CreateProductDto): Promise<Product> {
    const newProduct = new this.productModel(productDto);
    return newProduct.save();
  }

  /**
   * Retrieves a product by its unique ID.
   * @param id - The unique ID of the product.
   * @returns The product with the specified ID.
   */
  async findById(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
  }

  /**
   * Retrieves all products.
   * @returns An array of products.
   */
  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  /**
   * Deletes a product by its unique ID.
   * @param id - The unique ID of the product to delete.
   */
  async delete(id: string): Promise<void> {
    await this.productModel.findByIdAndDelete(id).exec();
  }

  /**
   * Retrieves the total count of all products.
   * @returns The total count of all products.
   */
  async count(): Promise<number> {
    return this.productModel.countDocuments().exec();
  }

  /**
   * Retrieves the count of products by model name.
   * @param modelName - The model name to filter by.
   * @returns The count of products with the specified model name.
   */
  async countByModelName(modelName: string): Promise<number> {
    return this.productModel.countDocuments({ modelName }).exec();
  }

  /**
   * Retrieves the count of products by name.
   * @param name - The name to filter by.
   * @returns The count of products with the specified name.
   */
  async countByName(name: string): Promise<number> {
    return this.productModel.countDocuments({ name }).exec();
  }

  /**
   * Updates a product by its unique ID.
   * @param id - The unique ID of the product to update.
   * @param updateProductDto - The data to update the product.
   * @returns The updated product.
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
   * Retrieves products by model name.
   * @param modelName - The model name to filter by.
   * @returns An array of products with the specified model name.
   */
  async findByModelName(modelName: string): Promise<Product[]> {
    return this.productModel.find({ modelName }).exec();
  }

  /**
   * Retrieves products by name.
   * @param name - The name to filter by.
   * @returns An array of products with the specified name.
   */
  async findByName(name: string): Promise<Product[]> {
    return this.productModel.find({ name }).exec();
  }
}
