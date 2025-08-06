import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IProductRepository } from './product.repository';
import { PostgresProduct } from '../entities/postgres-product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { Product } from '../entities/product.entity';

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

  async countAll(): Promise<number> {
    return this.productRepository.count();
  }

  async countByModel(modelName: string): Promise<number> {
    return this.productRepository.count({ where: { modelName } });
  }
}
