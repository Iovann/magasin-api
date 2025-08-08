import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoProductRepository } from './mongo-product.repository';
import { MongoProduct } from '../entities/mongo-product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { Product } from '../entities/product.entity';

const mockProductDoc = (product: Partial<Product>) => ({
  ...product,
  id: product.id || 'mock-id',
  _id: product.id || 'mock-id',
  name: product.name,
  modelName: product.modelName,
  quantity: product.quantity,
  price: product.price,
  createdAt: product.createdAt || new Date(),
  updatedAt: product.updatedAt || new Date(),
  save: jest.fn().mockResolvedValue(this),
});

describe('MongoProductRepository', () => {
  let repository: MongoProductRepository;
  let model: any;

  const mockProduct: Product = {
    id: '60d21b4667d0d8992e610c85',
    name: 'Test Product',
    modelName: 'Test Model',
    quantity: 10,
    price: 99.99,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoProductRepository,
        {
          provide: getModelToken(MongoProduct.name),
          useValue: jest.fn().mockImplementation((dto) => ({
            ...dto,
            save: jest.fn().mockResolvedValue(mockProductDoc({ ...dto, id: 'a-unique-id' })),
          })),
        },
      ],
    }).compile();

    repository = module.get<MongoProductRepository>(MongoProductRepository);
    model = module.get<Model<MongoProduct>>(getModelToken(MongoProduct.name));

    model.findById = jest.fn();
    model.find = jest.fn();
    model.findByIdAndDelete = jest.fn();
    model.countDocuments = jest.fn();
    model.findByIdAndUpdate = jest.fn();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new product', async () => {
      const createDto: CreateProductDto = {
        name: 'New Product',
        modelName: 'New Model',
        quantity: 20,
        price: 99.99,
      };

      const result = await repository.create(createDto);

      expect(model).toHaveBeenCalledWith(createDto);
      expect(result.id).toBe('a-unique-id');
      expect(result.name).toBe(createDto.name);
    });
  });

  describe('findById', () => {
    it('should find a product by its ID', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProductDoc(mockProduct)),
      } as any);

      const result = await repository.findById(mockProduct.id);

      expect(model.findById).toHaveBeenCalledWith(mockProduct.id);
      expect(result?.id).toEqual(mockProduct.id);
    });
  });
});
