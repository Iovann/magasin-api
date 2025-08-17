import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PostgresProductRepository } from "./postgres-product.repository";
import { PostgresProduct } from "../entities/postgres-product.entity";
import { CreateProductDto } from "../dto/create-product.dto";
import { Product } from "../entities/product.entity";

describe("PostgresProductRepository", () => {
  let repository: PostgresProductRepository;
  let mockProductRepository: jest.Mocked<Repository<PostgresProduct>>;

  const fixedDate = new Date("2025-08-17T10:00:00.000Z");

  const mockProduct: Product = {
    id: "1",
    name: "Test Product",
    modelName: "Test Model",
    quantity: 10,
    price: 29.99,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };

  const mockPostgresProduct: PostgresProduct = {
    id: "1",
    name: "Test Product",
    modelName: "Test Model",
    quantity: 10,
    price: 29.99,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };

  const createProductDto: CreateProductDto = {
    name: "Test Product",
    modelName: "Test Model",
    quantity: 10,
    price: 29.99,
  };

  beforeAll(() => {
    jest.spyOn(global, 'Date').mockImplementation(() => fixedDate);
  });

  afterAll(() => {
    jest.spyOn(global, 'Date').mockRestore();
  });

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostgresProductRepository,
        {
          provide: getRepositoryToken(PostgresProduct),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<PostgresProductRepository>(
      PostgresProductRepository,
    );
    mockProductRepository = module.get(getRepositoryToken(PostgresProduct));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new product", async () => {
      mockProductRepository.create.mockReturnValue(mockPostgresProduct);
      mockProductRepository.save.mockResolvedValue(mockPostgresProduct);

      const result = await repository.create(createProductDto);

      expect(mockProductRepository.create).toHaveBeenCalledWith(
        createProductDto,
      );
      expect(mockProductRepository.save).toHaveBeenCalledWith(
        mockPostgresProduct,
      );
      expect(result).toEqual(mockProduct);
    });
  });

  describe("findById", () => {
    it("should find a product by id", async () => {
      mockProductRepository.findOneBy.mockResolvedValue(mockPostgresProduct);

      const result = await repository.findById("1");

      expect(mockProductRepository.findOneBy).toHaveBeenCalledWith({ id: "1" });
      expect(result).toEqual(mockProduct);
    });

    it("should return null when product not found", async () => {
      mockProductRepository.findOneBy.mockResolvedValue(null);

      const result = await repository.findById("999");

      expect(mockProductRepository.findOneBy).toHaveBeenCalledWith({
        id: "999",
      });
      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should return all products", async () => {
      mockProductRepository.find.mockResolvedValue([mockPostgresProduct]);

      const result = await repository.findAll();

      expect(mockProductRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockProduct]);
    });
  });

  describe("delete", () => {
    it("should delete a product", async () => {
      mockProductRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      await repository.delete("1");

      expect(mockProductRepository.delete).toHaveBeenCalledWith("1");
    });
  });

  describe("count", () => {
    it("should return total count of products", async () => {
      mockProductRepository.count.mockResolvedValue(5);

      const result = await repository.count();

      expect(mockProductRepository.count).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });

  describe("countByModelName", () => {
    it("should return count of products by model name", async () => {
      mockProductRepository.count.mockResolvedValue(3);

      const result = await repository.countByModelName("Test Model");

      expect(mockProductRepository.count).toHaveBeenCalledWith({
        where: { modelName: "Test Model" },
      });
      expect(result).toBe(3);
    });
  });

  describe("countByName", () => {
    it("should return count of products by name", async () => {
      mockProductRepository.count.mockResolvedValue(2);

      const result = await repository.countByName("Test Product");

      expect(mockProductRepository.count).toHaveBeenCalledWith({
        where: { name: "Test Product" },
      });
      expect(result).toBe(2);
    });
  });

  describe("update", () => {
    it("should update an existing product", async () => {
      const updateData = { quantity: 15 };
      const updatedProduct = { ...mockPostgresProduct, quantity: 15 };

      mockProductRepository.findOneBy.mockResolvedValue(mockPostgresProduct);
      mockProductRepository.save.mockResolvedValue(updatedProduct);

      const result = await repository.update("1", updateData);

      expect(mockProductRepository.findOneBy).toHaveBeenCalledWith({ id: "1" });
      expect(mockProductRepository.save).toHaveBeenCalledWith(updatedProduct);
      expect(result).toEqual({ ...mockProduct, quantity: 15 });
    });

    it("should return null when product not found for update", async () => {
      mockProductRepository.findOneBy.mockResolvedValue(null);

      const result = await repository.update("999", { quantity: 15 });

      expect(mockProductRepository.findOneBy).toHaveBeenCalledWith({
        id: "999",
      });
      expect(mockProductRepository.save).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe("findByModelName", () => {
    it("should find products by model name", async () => {
      const mockProducts = [
        {
          id: "1",
          name: "Test Product",
          modelName: "Test Model",
          price: 29.99,
          quantity: 15,
          createdAt: new Date("2025-08-13T13:31:48.599Z"),
          updatedAt: new Date("2025-08-13T13:31:48.599Z"),
        },
      ];

      mockProductRepository.find.mockResolvedValue(mockProducts);

      const result = await repository.findByModelName("Test Model");

      expect(mockProductRepository.find).toHaveBeenCalledWith({
        where: { modelName: "Test Model" },
      });
      expect(result).toEqual(mockProducts);
    });
  });

  describe("findByName", () => {
    it("should find products by name", async () => {
      const mockProducts = [
        {
          id: "1",
          name: "Test Product",
          modelName: "Test Model",
          price: 29.99,
          quantity: 15,
          createdAt: new Date("2025-08-13T13:31:48.599Z"),
          updatedAt: new Date("2025-08-13T13:31:48.599Z"),
        },
      ];

      mockProductRepository.find.mockResolvedValue(mockProducts);

      const result = await repository.findByName("Test Product");

      expect(mockProductRepository.find).toHaveBeenCalledWith({
        where: { name: "Test Product" },
      });
      expect(result).toEqual(mockProducts);
    });
  });
});
