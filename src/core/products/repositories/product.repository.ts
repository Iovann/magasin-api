import { CreateProductDto } from "../dto/create-product.dto";
import { Product } from "../entities/product.entity";

export abstract class IProductRepository {
  abstract create(product: CreateProductDto): Promise<Product>;
  abstract findById(id: string): Promise<Product | null>;
  abstract findAll(): Promise<Product[]>;
  abstract delete(id: string): Promise<void>;
  abstract count(): Promise<number>;
  abstract countByModelName(modelName: string): Promise<number>;
  abstract countByName(name: string): Promise<number>;
  abstract update(
    id: string,
    updateData: Partial<Product>,
  ): Promise<Product | null>;
  abstract findByModelName(modelName: string): Promise<Product[]>;
  abstract findByName(name: string): Promise<Product[]>;
}
