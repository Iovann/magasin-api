import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ClientSession } from "mongoose";
import { IProductRepository, TransactionalManager } from "./product.repository";
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

  private getSession(session?: TransactionalManager): ClientSession | null {
    if (session && typeof (session as any).startTransaction === "function") {
      return session as ClientSession;
    }
    return null;
  }

  async create(
    productDto: CreateProductDto,
    session?: TransactionalManager,
  ): Promise<Product> {
    const newProduct = new this.productModel(productDto);
    return newProduct.save({ session: this.getSession(session) });
  }

  async findById(
    id: string,
    session?: TransactionalManager,
  ): Promise<Product | null> {
    return this.productModel
      .findById(id)
      .session(this.getSession(session))
      .exec();
  }

  async findAll(session?: TransactionalManager): Promise<Product[]> {
    return this.productModel.find().session(this.getSession(session)).exec();
  }

  async delete(id: string, session?: TransactionalManager): Promise<void> {
    await this.productModel
      .findByIdAndDelete(id)
      .session(this.getSession(session))
      .exec();
  }

  async count(session?: TransactionalManager): Promise<number> {
    return this.productModel
      .countDocuments()
      .session(this.getSession(session))
      .exec();
  }

  async countByModelName(
    modelName: string,
    session?: TransactionalManager,
  ): Promise<number> {
    return this.productModel
      .countDocuments({ modelName })
      .session(this.getSession(session))
      .exec();
  }

  async countByName(
    name: string,
    session?: TransactionalManager,
  ): Promise<number> {
    return this.productModel
      .countDocuments({ name })
      .session(this.getSession(session))
      .exec();
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    session?: TransactionalManager,
  ): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .session(this.getSession(session))
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
    return product.save({ session: this.getSession(session) });
  }

  async findByModelName(
    modelName: string,
    session?: TransactionalManager,
  ): Promise<Product[]> {
    return this.productModel
      .find({ modelName })
      .session(this.getSession(session))
      .exec();
  }

  async findByName(
    name: string,
    session?: TransactionalManager,
  ): Promise<Product[]> {
    return this.productModel
      .find({ name })
      .session(this.getSession(session))
      .exec();
  }
}
