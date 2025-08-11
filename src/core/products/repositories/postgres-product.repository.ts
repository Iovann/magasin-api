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

  async create(productDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(productDto);
    return this.productRepository.save(product);
  }

  async findById(id: string): Promise<Product | null> {
    return this.productRepository.findOneBy({ id });
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  async delete(id: string): Promise<void> {
    await this.productRepository.delete(id);
  }

  async count(): Promise<number> {
    return this.productRepository.count();
  }

  async countByModelName(modelName: string): Promise<number> {
    return this.productRepository.count({ where: { modelName } });
  }

  async countByName(name: string): Promise<number> {
    return this.productRepository.count({ where: { name } });
  }

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

  async findByModelName(modelName: string): Promise<Product[]> {
    return this.productRepository.find({ where: { modelName } });
  }

  async findByName(name: string): Promise<Product[]> {
    return this.productRepository.find({ where: { name } });
  }
}
