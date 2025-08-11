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

  async create(
    productDto: CreateProductDto,
  ): Promise<Product> {
    const newProduct = new this.productModel(productDto);
    return newProduct.save();
  }

  async findById(
    id: string,
  ): Promise<Product | null> {
    return this.productModel
      .findById(id)
      .exec();
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  async delete(id: string): Promise<void> {
    await this.productModel
      .findByIdAndDelete(id)
      .exec();
  }

  async count(): Promise<number> {
    return this.productModel
      .countDocuments()
      .exec();
  }

  async countByModelName(
    modelName: string,
  ): Promise<number> {
    return this.productModel
      .countDocuments({ modelName })
      .exec();
  }

  async countByName(
    name: string,
  ): Promise<number> {
    return this.productModel
      .countDocuments({ name })
      .exec();
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .exec();
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

  async findByModelName(
    modelName: string,
  ): Promise<Product[]> {
    return this.productModel
      .find({ modelName })
      .exec();
  }

  async findByName(
    name: string,
  ): Promise<Product[]> {
    return this.productModel
      .find({ name })
      .exec();
  }
}
