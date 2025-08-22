import { Test, TestingModule } from "@nestjs/testing";
import { FsProductRepository } from "./fs-product.repository";
import { DatabaseConfig } from "../../../config/database.config";

describe("FsProductRepository", () => {
  let repository: FsProductRepository;
  let mockDatabaseConfig: DatabaseConfig;

  const mockDataPath = "/tmp/test-data";
  const mockProductsFilePath = "/tmp/test-data/products.json";

  let module: TestingModule;
  beforeEach(async () => {
    mockDatabaseConfig = {
      dbPath: mockDataPath,
    } as DatabaseConfig;

    module = await Test.createTestingModule({
      providers: [
        FsProductRepository,
        {
          provide: DatabaseConfig,
          useValue: mockDatabaseConfig,
        },
      ],
    }).compile();

    repository = module.get<FsProductRepository>(FsProductRepository);
  });

  afterEach(() => {
    module.close();
  });

  describe("constructor", () => {
    it("should set dbPath correctly", () => {
      expect(repository["dbPath"]).toBe(mockProductsFilePath);
    });
  });

  describe("basic functionality", () => {
    it("should be defined", () => {
      expect(repository).toBeDefined();
    });

    it("should have required methods", () => {
      expect(typeof repository.create).toBe("function");
      expect(typeof repository.findById).toBe("function");
      expect(typeof repository.findAll).toBe("function");
      expect(typeof repository.update).toBe("function");
      expect(typeof repository.delete).toBe("function");
      expect(typeof repository.count).toBe("function");
      expect(typeof repository.findByModelName).toBe("function");
      expect(typeof repository.findByName).toBe("function");
    });
  });
});
