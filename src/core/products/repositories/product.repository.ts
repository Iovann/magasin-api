import { CreateProductDto } from '../dto/create-product.dto';
import { Product } from '../entities/product.entity';

export abstract class IProductRepository {
  abstract create(product: CreateProductDto): Promise<Product>;
  abstract findById(id: string): Promise<Product | null>;
  abstract findAll(): Promise<Product[]>;
  abstract delete(id: string): Promise<void>;
  abstract countAll(): Promise<number>;
  abstract countByModel(model: string): Promise<number>;
  // On pourrait ajouter une méthode update plus générique plus tard si besoin
}
