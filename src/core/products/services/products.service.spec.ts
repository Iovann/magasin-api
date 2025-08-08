
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { IProductRepository } from '../repositories/product.repository';
import { CreateProductDto } from '../dto/create-product.dto';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Product } from '../entities/product.entity';

// Création d'un mock pour IProductRepository
const mockProductRepository = {
  create: jest.fn(),
  count: jest.fn(),
  countByModelName: jest.fn(),
  countByName: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: IProductRepository,
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should call repository.create with correct data', async () => {
      const createProductDto: CreateProductDto = { name: 'WaterGun 5000', modelName: 'WG5000', quantity: 100 };
      const expectedProduct = { id: '1', ...createProductDto, createdAt: new Date(), updatedAt: new Date() };
      
      mockProductRepository.countByModelName.mockResolvedValue(0);
      mockProductRepository.countByName.mockResolvedValue(0);
      mockProductRepository.create.mockResolvedValue(expectedProduct);

      const result = await service.create(createProductDto);

      expect(mockProductRepository.countByModelName).toHaveBeenCalledWith(createProductDto.modelName);
      expect(mockProductRepository.countByName).toHaveBeenCalledWith(createProductDto.name);
      expect(mockProductRepository.create).toHaveBeenCalledWith(createProductDto);
      expect(result).toEqual(expectedProduct);
    });

    it('should throw a ConflictException if the product modelName already exists', async () => {
      const createProductDto: CreateProductDto = { name: 'WaterGun 5000', modelName: 'WG5000', quantity: 100 };
      
      mockProductRepository.countByModelName.mockResolvedValue(1);

      await expect(service.create(createProductDto)).rejects.toThrow(
        new ConflictException(`Un produit avec le model ${createProductDto.modelName} existe déjà`)
      );
      expect(mockProductRepository.countByName).not.toHaveBeenCalled();
      expect(mockProductRepository.create).not.toHaveBeenCalled();
    });

    it('should throw a ConflictException if the product name already exists', async () => {
      const createProductDto: CreateProductDto = { name: 'WaterGun 5000', modelName: 'WG5001', quantity: 100, price: 10 };
      
      mockProductRepository.countByModelName.mockResolvedValue(0);
      mockProductRepository.countByName.mockResolvedValue(1);

      await expect(service.create(createProductDto)).rejects.toThrow(
        new ConflictException(`Un produit avec le nom ${createProductDto.name} existe déjà`)
      );
      expect(mockProductRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getTotalStock', () => {
    it('should call repository.count and return the total stock', async () => {
      mockProductRepository.count.mockResolvedValue(500);

      const result = await service.getTotalStock();

      expect(mockProductRepository.count).toHaveBeenCalled();
      expect(result).toBe(500);
    });
  });

  describe('getStockByModel', () => {
    it('should call repository.countByModelName with the correct model', async () => {
      const modelName = 'WG5000';
      mockProductRepository.countByModelName.mockResolvedValue(150);

      const result = await service.getStockByModel(modelName);

      expect(mockProductRepository.countByModelName).toHaveBeenCalledWith(modelName);
      expect(result).toBe(150);
    });
  });

  describe('sellProduct', () => {
    const productId = 'some-uuid';
    const product: Product = {
      id: productId,
      name: 'Test Product',
      modelName: 'TP100',
      quantity: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully sell a product and update quantity', async () => {
      mockProductRepository.findById.mockResolvedValue(product);
      mockProductRepository.update.mockResolvedValue({ ...product, quantity: 5 });

      const result = await service.sellProduct(productId, 5);

      expect(mockProductRepository.findById).toHaveBeenCalledWith(productId);
      expect(mockProductRepository.update).toHaveBeenCalledWith(productId, { quantity: 5 });
      expect(result.quantity).toBe(5);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(service.sellProduct(productId, 5)).rejects.toThrow(
        new NotFoundException(`Produit avec l'ID ${productId} non trouvé`)
      );
      expect(mockProductRepository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      mockProductRepository.findById.mockResolvedValue(product);

      await expect(service.sellProduct(productId, 15)).rejects.toThrow(
        new BadRequestException(
          `Quantité insuffisante en stock pour le produit ${product.name}. Stock actuel: ${product.quantity}`
        )
      );
      expect(mockProductRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('updateStock', () => {
    const productId = 'some-uuid';
    const product: Product = {
      id: productId,
      name: 'Test Product',
      modelName: 'TP100',
      quantity: 10,
      price: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully update product stock', async () => {
      mockProductRepository.findById.mockResolvedValue(product);
      mockProductRepository.update.mockResolvedValue({ ...product, quantity: 30 });
    
      const result = await service.updateStock(productId, 20);
    
      expect(mockProductRepository.findById).toHaveBeenCalledWith(productId);
      expect(mockProductRepository.update).toHaveBeenCalledWith(productId, { quantity: 30 });
      expect(result.quantity).toBe(30);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(service.updateStock(productId, 5)).rejects.toThrow(
        new NotFoundException(`Produit avec l'ID ${productId} non trouvé`)
      );
      expect(mockProductRepository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if quantity is negative', async () => {
      mockProductRepository.findById.mockResolvedValue(product);

      await expect(service.updateStock(productId, -5)).rejects.toThrow(
        new BadRequestException(`La quantité ne peut pas être négative`)
      );
      expect(mockProductRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should call repository.delete with the correct id', async () => {
      const productId = 'some-uuid';
      mockProductRepository.delete.mockResolvedValue(undefined);

      await service.remove(productId);

      expect(mockProductRepository.delete).toHaveBeenCalledWith(productId);
    });
  });
});
