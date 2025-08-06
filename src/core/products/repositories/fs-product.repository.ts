import { Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { IProductRepository } from './product.repository';
import { CreateProductDto } from '../dto/create-product.dto';
import { Product } from '../entities/product.entity';
import { DatabaseConfig } from '../../../config/database.config';

@Injectable()
export class FsProductRepository implements IProductRepository, OnModuleInit {
  private dbPath: string;
  private data: Product[] = [];

  constructor(private readonly dbConfig: DatabaseConfig) {
    // We get the path from the injected config
    this.dbPath = path.resolve(this.dbConfig.dbPath, 'products.json');
  }

  async onModuleInit() {
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      const fileContent = await fs.readFile(this.dbPath, 'utf-8');
      this.data = JSON.parse(fileContent);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, initialize with empty array
        this.data = [];
        await this.persist();
      } else {
        throw error;
      }
    }
  }

  private async persist(): Promise<void> {
    await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
  }

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

  async findById(id: string): Promise<Product | null> {
    return this.data.find(p => p.id === id) || null;
  }

  async findAll(): Promise<Product[]> {
    return [...this.data];
  }

  async delete(id: string): Promise<void> {
    const initialLength = this.data.length;
    this.data = this.data.filter(p => p.id !== id);
    if (this.data.length < initialLength) {
      await this.persist();
    }
  }

  async countAll(): Promise<number> {
    return this.data.length;
  }

  async countByModel(modelName: string): Promise<number> {
    return this.data.filter(p => p.modelName === modelName).length;
  }
}
