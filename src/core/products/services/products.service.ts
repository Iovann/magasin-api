
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from '../dto/create-product.dto';
import { IProductRepository } from '../repositories/product.repository';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(private readonly productRepository: IProductRepository) { }

  async create(createProductDto: CreateProductDto) {
    const existingProductByModelName = await this.productRepository.countByModelName(
      createProductDto.modelName,
    );
    if (existingProductByModelName > 0) {
      throw new ConflictException(
        `Un produit avec le model ${createProductDto.modelName} existe déjà`,
      );
    }

    const existingProductByName = await this.productRepository.countByName(
      createProductDto.name,
    );
    if (existingProductByName > 0) {
      throw new ConflictException(
        `Un produit avec le nom ${createProductDto.name} existe déjà`,
      );
    }
    return this.productRepository.create(createProductDto);
  }

  getTotalStock() {
    return this.productRepository.count();
  }

  getAllProducts() {
    return this.productRepository.findAll();
  }

  getProductById(id: string) {
    return this.productRepository.findById(id);
  }

  async getStockByModel(modelName: string) {
    return this.productRepository.countByModelName(modelName);
  }

  async sellProduct(id: string, quantity: number): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }
    if (product.quantity < quantity) {
      throw new BadRequestException(
        `Quantité insuffisante en stock pour le produit ${product.name}. Stock actuel: ${product.quantity}`,
      );
    }
    const updatedProduct = await this.productRepository.update(id, { quantity: product.quantity - quantity });

    if (!updatedProduct) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }
    return updatedProduct;
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }

    if (quantity < 0) {
      throw new BadRequestException(`La quantité ne peut pas être négative`);
    }

    const newQuantity = product.quantity + quantity;
    const updatedProduct = await this.productRepository.update(id, { quantity: newQuantity });

    if (!updatedProduct) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé lors de la mise à jour`);
    }
    return updatedProduct;
  }

  async getProductsByModelName(modelName: string): Promise<Product[]> {
    return this.productRepository.findByModelName(modelName);
  }

  async getProductsByName(name: string): Promise<Product[]> {
    return this.productRepository.findByName(name);
  }

  async countProductsByModelName(modelName: string): Promise<number> {
    return this.productRepository.countByModelName(modelName);
  }

  async countProductsByName(name: string): Promise<number> {
    return this.productRepository.countByName(name);
  }

  remove(id: string) {
    return this.productRepository.delete(id);
  }
}
