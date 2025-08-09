import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MongoProductRepository } from "./mongo-product.repository";
import { MongoProduct } from "../entities/mongo-product.entity";
import { CreateProductDto } from "../dto/create-product.dto";
import { Product } from "../entities/product.entity";
import { UpdateProductDto } from "../dto/update-product.dto";
import { NotFoundException } from "@nestjs/common";

// A mock product document to be returned by Mongoose queries
const mockProduct: Product = {
  id: "60d21b4667d0d8992e610c85",
  name: "Test Product",
  modelName: "Test Model",
  quantity: 10,
  price: 99.99,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// This is the mock of an instance of the model
const mockProductInstance = {
  ...mockProduct,
  save: jest.fn().mockResolvedValue(mockProduct),
};

// This is the mock of the static Model methods
const mockProductModel = {
  new: jest.fn().mockResolvedValue(mockProductInstance),
  constructor: jest.fn().mockResolvedValue(mockProductInstance),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

describe("MongoProductRepository", () => {
  let repository: MongoProductRepository;
  let model: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoProductRepository,
        {
          provide: getModelToken(MongoProduct.name),
          // We provide a mock that can be instantiated with `new`
          useValue: jest.fn().mockImplementation(() => mockProductInstance),
        },
      ],
    }).compile();

    repository = module.get<MongoProductRepository>(MongoProductRepository);
    model = module.get<Model<MongoProduct>>(getModelToken(MongoProduct.name));

    // Attach static mocks to the constructor mock
    Object.assign(model, mockProductModel);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("create", () => {
    it("should create and return a product", async () => {
      const createDto: CreateProductDto = { ...mockProduct };

      const result = await repository.create(createDto);

      // Check that the model was instantiated with the DTO
      expect(model).toHaveBeenCalledWith(createDto);
      // Check that the save method on the instance was called
      expect(mockProductInstance.save).toHaveBeenCalled();
      // Check the result
      expect(result).toEqual(mockProduct);
    });
  });

  describe("findById", () => {
    it("should find and return a product by ID", async () => {
      jest.spyOn(model, "findById").mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockProduct),
      } as any);

      const result = await repository.findById(mockProduct.id);
      expect(model.findById).toHaveBeenCalledWith(mockProduct.id);
      expect(result).toEqual(mockProduct);
    });
  });

  describe("findAll", () => {
    it("should return an array of products", async () => {
      const products = [mockProduct, mockProduct];
      jest.spyOn(model, "find").mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(products),
      } as any);

      const result = await repository.findAll();
      expect(model.find).toHaveBeenCalled();
      expect(result).toEqual(products);
    });
  });

  describe("delete", () => {
    it("should call findByIdAndDelete with the correct ID", async () => {
      jest.spyOn(model, "findByIdAndDelete").mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockProduct),
      } as any);

      await repository.delete(mockProduct.id);
      expect(model.findByIdAndDelete).toHaveBeenCalledWith(mockProduct.id);
    });
  });

  describe("count", () => {
    it("should return the total count of documents", async () => {
      jest.spyOn(model, "countDocuments").mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(5),
      } as any);

      const result = await repository.count();
      expect(model.countDocuments).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });

  describe("update", () => {
    it("should find, update, and return the product", async () => {
      const updateDto: UpdateProductDto = { quantity: 50, price: 150 };
      const updatedProduct = { ...mockProduct, ...updateDto };

      const findByIdResult = {
        ...mockProduct,
        ...updateDto,
        save: jest.fn().mockResolvedValue(updatedProduct),
      };

      jest.spyOn(model, "findById").mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(findByIdResult),
      } as any);

      const result = await repository.update(mockProduct.id, updateDto);

      expect(model.findById).toHaveBeenCalledWith(mockProduct.id);
      expect(findByIdResult.save).toHaveBeenCalled();
      expect(result).toEqual(updatedProduct);
    });

    it("should throw NotFoundException if product to update is not found", async () => {
      jest.spyOn(model, "findById").mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(repository.update(mockProduct.id, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
