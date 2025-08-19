import { DuckDBProductRepository } from './duckdb-product.reposetory';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseConfig } from '../../../../src/config/database.config';
import { DuckDBConnection } from '@duckdb/node-api';
import { DuckDBService } from '../../../../src/libs/database/duckdb.service';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mocked-uuid-1234'
  }
});

describe('DuckDBProductRepository', () => {
  let repository: DuckDBProductRepository;
  let mockConnection: jest.Mocked<DuckDBConnection>;
  let mockDuckDBService: jest.Mocked<DuckDBService>;
  
  const mockConfig: DatabaseConfig = {
    nodeEnv: 'development',
    dbPath: './test-db',
    dbType: 'duckdb',
  };

  const mockProduct = {
    name: 'Test Product',
    modelName: 'TEST-123',
    description: 'A test product',
    price: 99.99,
    quantity: 10,
  };

  beforeEach(async () => {
    // Create mock DuckDB connection
    mockConnection = {
      run: jest.fn().mockResolvedValue(undefined),
      runAndReadAll: jest.fn().mockResolvedValue({
        getRowObjectsJS: jest.fn().mockReturnValue([{
          id: '1',
          name: 'Test Product',
          modelName: 'TEST-123',
          description: 'A test product',
          price: '99.99',
          quantity: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }])
      }),
      closeSync: jest.fn(),
    } as unknown as jest.Mocked<DuckDBConnection>;

    // Mock DuckDBService
    mockDuckDBService = {
      getConnection: jest.fn().mockResolvedValue(mockConnection)
    } as unknown as jest.Mocked<DuckDBService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DuckDBProductRepository,
        {
          provide: DuckDBService,
          useValue: mockDuckDBService,
        },
        {
          provide: DatabaseConfig,
          useValue: mockConfig,
        },
      ],
    }).compile();

    repository = module.get<DuckDBProductRepository>(DuckDBProductRepository);
    
    // Wait for onModuleInit to complete
    await repository.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const result = await repository.create(mockProduct);
      
      expect(result).toHaveProperty('id', 'mocked-uuid-1234');
      expect(result.name).toBe(mockProduct.name);
      expect(result.modelName).toBe(mockProduct.modelName);
      expect(mockConnection.run).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find a product by id', async () => {
      const productId = '1';
      const product = await repository.findById(productId);
      
      expect(product).toBeDefined();
      expect(product?.id).toBe('1');
      expect(mockConnection.runAndReadAll).toHaveBeenCalled();
    });

    it('should return null if product not found', async () => {
      mockConnection.runAndReadAll = jest.fn().mockResolvedValueOnce({
        getRowObjectsJS: jest.fn().mockReturnValue([])
      });
      
      const product = await repository.findById('non-existent-id');
      expect(product).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      mockConnection.runAndReadAll = jest.fn().mockResolvedValueOnce({
        getRowObjectsJS: jest.fn().mockReturnValue([
          { id: '1', ...mockProduct, name: 'Product 1' },
          { id: '2', ...mockProduct, name: 'Product 2' }
        ])
      });
      
      const products = await repository.findAll();
      
      expect(products).toHaveLength(2);
      expect(products[0]?.name).toBe('Product 1');
      expect(products[1]?.name).toBe('Product 2');
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const productId = '1';
      const updateData = { 
        name: 'Updated Product',
        price: 199.99 
      };
      
      await repository.update(productId, updateData);
      
      expect(mockConnection.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE products SET'),
        expect.arrayContaining([updateData.name, updateData.price])
      );
    });

    it('should only update provided fields', async () => {
      const productId = '1';
      const updateData = { name: 'Updated Name' };
      
      await repository.update(productId, updateData);
      
      expect(mockConnection.run).toHaveBeenCalledWith(
        `UPDATE products SET name = ?, updatedAt = ? WHERE id = ?`,
        [updateData.name, expect.any(String), productId]
      );
    });
  });

  describe('delete', () => {
    it('should delete a product', async () => {
      const productId = '1';
      
      await repository.delete(productId);
      
      expect(mockConnection.run).toHaveBeenCalledWith(
        `DELETE FROM products WHERE id = ?`,
        [productId]
      );
    });
  });

  describe('findByModelName', () => {
    it('should find products by model name', async () => {
      const modelName = 'TEST-123';
      
      await repository.findByModelName(modelName);
      
      expect(mockConnection.runAndReadAll).toHaveBeenCalledWith(
        `SELECT * FROM products WHERE modelName = ?`,
        [modelName]
      );
    });
  });

  describe('findByName', () => {
    it('should find products by name', async () => {
      const name = 'Test Product';
      
      await repository.findByName(name);
      
      expect(mockConnection.runAndReadAll).toHaveBeenCalledWith(
        `SELECT * FROM products WHERE name = ?`,
        [name]
      );
    });
  });

  describe('count', () => {
    it('should return the count of products', async () => {
      mockConnection.runAndReadAll = jest.fn().mockResolvedValueOnce({
        getRowObjectsJS: jest.fn().mockReturnValue([{ count: '5' }])
      });
      
      const count = await repository.count();
      
      expect(count).toBe(5);
      expect(mockConnection.runAndReadAll).toHaveBeenCalledWith(
        `SELECT COUNT(*) as count FROM products`,
        []
      );
    });
  });
});
