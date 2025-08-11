import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { MongoProductRepository } from "./mongo-product.repository";
import { MongoProduct } from "../entities/mongo-product.entity";
import { CreateProductDto } from "../dto/create-product.dto";
import { Product } from "../entities/product.entity";
import { UpdateProductDto } from "../dto/update-product.dto";
import { NotFoundException } from "@nestjs/common";

const mockProduct: Product = {
  id: "60d21b4667d0d8992e610c85",
  name: "Test Product",
  modelName: "Test Model",
  quantity: 10,
  price: 99.99,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockQuery = {
  session: jest.fn().mockReturnThis(),
  exec: jest.fn(),
};

const mockSave = jest.fn().mockResolvedValue(mockProduct);

class MockProductModel {
  constructor(public data: any) {}

  save = mockSave;

  static find = jest.fn().mockReturnValue(mockQuery);
  static findById = jest.fn().mockReturnValue(mockQuery);
  static findByIdAndDelete = jest.fn().mockReturnValue(mockQuery);
  static countDocuments = jest.fn().mockReturnValue(mockQuery);
  static findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
}

describe("MongoProductRepository", () => {
  let repository: MongoProductRepository;

  beforeEach(async () => {
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
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("create", () => {
    it("should create and return a product", async () => {
      const createDto: CreateProductDto = { ...mockProduct };
      const result = await repository.create(createDto);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });
  });

  describe("findById", () => {
    it("should find and return a product by ID", async () => {
      mockQuery.exec.mockResolvedValue(mockProduct);
      const result = await repository.findById(mockProduct.id);
      expect(MockProductModel.findById).toHaveBeenCalledWith(mockProduct.id);
      expect(result).toEqual(mockProduct);
    });
  });

  describe("findAll", () => {
    it("should return an array of products", async () => {
      const products = [mockProduct, mockProduct];
      mockQuery.exec.mockResolvedValue(products);
      const result = await repository.findAll();
      expect(MockProductModel.find).toHaveBeenCalled();
      expect(result).toEqual(products);
    });
  });

  describe("delete", () => {
    it("should call findByIdAndDelete with the correct ID", async () => {
      mockQuery.exec.mockResolvedValue(mockProduct);
      await repository.delete(mockProduct.id);
      expect(MockProductModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockProduct.id,
      );
    });
  });

  describe("count", () => {
    it("should return the total count of documents", async () => {
      mockQuery.exec.mockResolvedValue(5);
      const result = await repository.count();
      expect(MockProductModel.countDocuments).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });

  describe("update", () => {
    it("should find, update, and return the product", async () => {
      const updateDto: UpdateProductDto = { quantity: 50, price: 150 };
      const updatedProduct = { ...mockProduct, ...updateDto };
      const save = jest.fn().mockResolvedValue(updatedProduct);
      const findByIdResult = { ...mockProduct, ...updateDto, save };

      mockQuery.exec.mockResolvedValue(findByIdResult);

      const result = await repository.update(mockProduct.id, updateDto);

      expect(MockProductModel.findById).toHaveBeenCalledWith(mockProduct.id);
      expect(save).toHaveBeenCalled();
      expect(result).toEqual(updatedProduct);
    });

    it("should throw NotFoundException if product to update is not found", async () => {
      mockQuery.exec.mockResolvedValue(null);
      await expect(repository.update(mockProduct.id, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
