import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";
import { IProductRepository, TransactionalManager } from "./product.repository";
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

  private getManager(
    session?: TransactionalManager,
  ): Repository<PostgresProduct> {
    if (session && session instanceof EntityManager) {
      return session.getRepository(PostgresProduct);
    }
    return this.productRepository;
  }

  async create(
    productDto: CreateProductDto,
    session?: TransactionalManager,
  ): Promise<Product> {
    const manager = this.getManager(session);
    const product = manager.create(productDto);
    return manager.save(product);
  }

  async findById(
    id: string,
    session?: TransactionalManager,
  ): Promise<Product | null> {
    const manager = this.getManager(session);
    return manager.findOneBy({ id });
  }

  async findAll(session?: TransactionalManager): Promise<Product[]> {
    const manager = this.getManager(session);
    return manager.find();
  }

  async delete(id: string, session?: TransactionalManager): Promise<void> {
    const manager = this.getManager(session);
    await manager.delete(id);
  }

  async count(session?: TransactionalManager): Promise<number> {
    const manager = this.getManager(session);
    return manager.count();
  }

  async countByModelName(
    modelName: string,
    session?: TransactionalManager,
  ): Promise<number> {
    const manager = this.getManager(session);
    return manager.count({ where: { modelName } });
  }

  async countByName(
    name: string,
    session?: TransactionalManager,
  ): Promise<number> {
    const manager = this.getManager(session);
    return manager.count({ where: { name } });
  }

  async update(
    id: string,
    updateData: UpdateProductDto,
    session?: TransactionalManager,
  ): Promise<Product | null> {
    const manager = this.getManager(session);
    const product = await manager.findOneBy({ id });
    if (!product) {
      return null;
    }
    Object.assign(product, updateData);
    return manager.save(product);
  }

  async findByModelName(
    modelName: string,
    session?: TransactionalManager,
  ): Promise<Product[]> {
    const manager = this.getManager(session);
    return manager.find({ where: { modelName } });
  }

  async findByName(
    name: string,
    session?: TransactionalManager,
  ): Promise<Product[]> {
    const manager = this.getManager(session);
    return manager.find({ where: { name } });
  }
}
