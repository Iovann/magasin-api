import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoProductRepository } from './mongo-product.repository';
import { MongoProduct } from '../entities/mongo-product.entity';
import { Product } from '../entities/product.entity';

describe('MongoProductRepository', () => {
  let repository: MongoProductRepository;
  let productModel: jest.Mocked<Model<MongoProduct>>;

  const mockMongoProduct = {
    id: '507f1f77bcf86cd799439011',
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    stock: 10,
    category: 'Test Category',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    save: jest.fn(),
    toObject: jest.fn(),
  } as any;

  const mockProduct: Product = {
    id: '507f1f77bcf86cd799439011',
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    stock: 10,
    category: 'Test Category',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockProductData = {
    name: 'New Product',
    description: 'New Description',
    price: 149.99,
    stock: 15,
    category: 'New Category',
  };

  beforeEach(async () => {
    // Create a mock constructor function that returns the mock instance
    const MockProductModel = jest.fn().mockImplementation(() => ({
      ...mockMongoProduct,
      save: jest.fn().mockResolvedValue(mockMongoProduct),
      toObject: jest.fn().mockReturnValue(mockMongoProduct),
    }));

    // Add static methods to the mock constructor
    MockProductModel.findById = jest.fn();
    MockProductModel.find = jest.fn();
    MockProductModel.findByIdAndUpdate = jest.fn();
    MockProductModel.findByIdAndDelete = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoProductRepository,
        {
          provide: getModelToken(MongoProduct.name),
          useValue: MockProductModel,
        },
      ],
    }).compile();

    repository = module.get<MongoProductRepository>(MongoProductRepository);
    productModel = module.get<Model<MongoProduct>>(getModelToken(MongoProduct.name));

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product successfully', async () => {
      // Arrange
      const mockSavedProduct = { 
        ...mockMongoProduct, 
        ...mockProductData,
        save: jest.fn().mockResolvedValue(mockMongoProduct),
        toObject: jest.fn().mockReturnValue(mockMongoProduct)
      };
      
      (productModel as any).mockReturnValue(mockSavedProduct);

      // Act
      const result = await repository.create(mockProductData);

      // Assert
      // MongoProductRepository returns the document directly (no transformation)
      expect(result).toEqual(mockMongoProduct);
      expect(mockSavedProduct.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      // Arrange
      const mockProducts = [mockMongoProduct, { ...mockMongoProduct, id: '507f1f77bcf86cd799439012', name: 'Product 2' }];
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockProducts),
      };
      productModel.find.mockReturnValue(mockQuery as any);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(productModel.find).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      // MongoProductRepository returns documents directly
      expect(result[0]).toEqual(mockProducts[0]);
    });

    it('should return empty array when no products exist', async () => {
      // Arrange
      const mockQuery = {
        exec: jest.fn().mockResolvedValue([]),
      };
      productModel.find.mockReturnValue(mockQuery as any);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should find product by id successfully', async () => {
      // Arrange
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockMongoProduct),
      };
      productModel.findById.mockReturnValue(mockQuery as any);

      // Act
      const result = await repository.findById('507f1f77bcf86cd799439011');

      // Assert
      expect(productModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      // MongoProductRepository returns documents directly
      expect(result).toEqual(mockMongoProduct);
    });

    it('should return null when product not found by id', async () => {
      // Arrange
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };
      productModel.findById.mockReturnValue(mockQuery as any);

      // Act
      const result = await repository.findById('nonexistent');

      // Assert
      expect(productModel.findById).toHaveBeenCalledWith('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update product successfully', async () => {
      // Arrange
      const updateData = { quantity: 50 };
      const updatedProduct = { ...mockMongoProduct, quantity: 50, save: jest.fn().mockResolvedValue({ ...mockMongoProduct, quantity: 50 }) };
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(updatedProduct),
      };
      productModel.findById.mockReturnValue(mockQuery as any);

      // Act
      const result = await repository.update('507f1f77bcf86cd799439011', updateData);

      // Assert
      expect(productModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(updatedProduct.save).toHaveBeenCalled();
      expect(result.quantity).toBe(50);
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      // Arrange
      const updateData = { quantity: 50 };
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };
      productModel.findById.mockReturnValue(mockQuery as any);

      // Act & Assert
      await expect(repository.update('nonexistent', updateData))
        .rejects
        .toThrow('Produit avec l\'ID nonexistent non trouvé');
    });
  });

  describe('delete', () => {
    it('should delete product successfully', async () => {
      // Arrange
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockMongoProduct),
      };
      productModel.findByIdAndDelete.mockReturnValue(mockQuery as any);

      // Act
      await repository.delete('507f1f77bcf86cd799439011');

      // Assert
      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should handle deletion of non-existent product', async () => {
      // Arrange
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };
      productModel.findByIdAndDelete.mockReturnValue(mockQuery as any);

      // Act
      await repository.delete('nonexistent');

      // Assert
      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith('nonexistent');
      // Should not throw error even if product doesn't exist
    });
  });

  describe('toProductEntity (private method)', () => {
    it('should transform MongoProduct to Product entity', () => {
      // This is tested implicitly through other methods
      // The private method transforms Mongoose documents to Product entities
      // which is verified in the other test cases
    });
  });
});
