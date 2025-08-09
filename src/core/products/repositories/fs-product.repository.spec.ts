import { Test, TestingModule } from "@nestjs/testing";
import { FsProductRepository } from "./fs-product.repository";
import { DatabaseConfig } from "../../../config/database.config";
import { promises as fs } from "fs";
import * as path from "path";
import { CreateProductDto } from "../dto/create-product.dto";

// We mock the entire 'fs' module.
// Every time the code imports 'fs', it will get our mocked version.
jest.mock("fs", () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    // By default, we simulate an empty file
    readFile: jest.fn().mockResolvedValue("[]"),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

// We also mock the 'crypto' module to control the generated IDs
jest.mock("crypto", () => ({
  randomUUID: jest.fn().mockReturnValue("mocked-uuid-123"),
}));

describe("FsProductRepository", () => {
  let repository: FsProductRepository;
  let mockDbConfig: DatabaseConfig;

  // Before each test, we reconfigure our test module
  beforeEach(async () => {
    // We create a fake configuration for the tests
    mockDbConfig = {
      dbPath: "./test-data",
    } as DatabaseConfig;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FsProductRepository,
        // We provide our fake configuration
        {
          provide: DatabaseConfig,
          useValue: mockDbConfig,
        },
      ],
    }).compile();

    repository = module.get<FsProductRepository>(FsProductRepository);

    // We make sure the repository is properly initialized (calls onModuleInit)
    await repository.onModuleInit();

    // We clear the mocks between each test to avoid interference
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("create", () => {
    it("should create a new product, add it to the data array, and persist", async () => {
      const createDto: CreateProductDto = {
        name: "Water Gun 5000",
        modelName: "WG5K",
        quantity: 10,
        price: 25.5,
      };

      const result = await repository.create(createDto);

      // 1. Check that the returned product is correct
      expect(result.id).toBe("mocked-uuid-123");
      expect(result.name).toBe(createDto.name);

      // 2. Check that the write method was called
      expect(fs.writeFile).toHaveBeenCalledTimes(1);

      // 3. Check that the written data is correct
      const expectedDataToWrite = JSON.stringify([result], null, 2);
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.resolve(mockDbConfig.dbPath, "products.json"),
        expectedDataToWrite,
      );
    });
  });

  describe("findAll", () => {
    it("should return all products from the data file", async () => {
      // We simulate a file containing two products
      const mockData = [
        {
          id: "1",
          name: "Product 1",
          modelName: "A",
          quantity: 1,
          createdAt: new Date(),
        },
        {
          id: "2",
          name: "Product 2",
          modelName: "B",
          quantity: 2,
          createdAt: new Date(),
        },
      ];
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      // We reinitialize the repository so it loads the new data
      await repository.onModuleInit();

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Product 1");
    });
  });

  describe("findById", () => {
    it("should return a product if found", async () => {
      const mockData = [
        {
          id: "abc",
          name: "Found Me",
          modelName: "A",
          quantity: 1,
          createdAt: new Date(),
        },
      ];
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
      await repository.onModuleInit();

      const result = await repository.findById("abc");
      expect(result).toBeDefined();
      expect(result?.name).toBe("Found Me");
    });

    it("should return null if not found", async () => {
      const result = await repository.findById("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should remove a product and persist the changes", async () => {
      const mockData = [
        {
          id: "to-delete",
          name: "Delete Me",
          modelName: "A",
          quantity: 1,
          createdAt: new Date(),
        },
      ];
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
      await repository.onModuleInit();

      await repository.delete("to-delete");

      // Check that write was called with an empty array
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify([], null, 2),
      );
    });
  });
});
