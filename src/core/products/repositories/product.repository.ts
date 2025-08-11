import { CreateProductDto } from "../dto/create-product.dto";
import { Product } from "../entities/product.entity";
import { ClientSession } from "mongoose";
import { EntityManager } from "typeorm";

export type TransactionalManager = EntityManager | ClientSession;

export abstract class IProductRepository {
  abstract create(
    product: CreateProductDto,
    session?: TransactionalManager,
  ): Promise<Product>;
  abstract findById(
    id: string,
    session?: TransactionalManager,
  ): Promise<Product | null>;
  abstract findAll(session?: TransactionalManager): Promise<Product[]>;
  abstract delete(id: string, session?: TransactionalManager): Promise<void>;
  abstract count(session?: TransactionalManager): Promise<number>;
  abstract countByModelName(
    modelName: string,
    session?: TransactionalManager,
  ): Promise<number>;
  abstract countByName(
    name: string,
    session?: TransactionalManager,
  ): Promise<number>;
  abstract update(
    id: string,
    updateData: Partial<Product>,
    session?: TransactionalManager,
  ): Promise<Product | null>;
  abstract findByModelName(
    modelName: string,
    session?: TransactionalManager,
  ): Promise<Product[]>;
  abstract findByName(
    name: string,
    session?: TransactionalManager,
  ): Promise<Product[]>;
}
