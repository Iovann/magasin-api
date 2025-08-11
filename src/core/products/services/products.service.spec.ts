import { Test, TestingModule } from "@nestjs/testing";
import { ProductsService } from "./products.service";
import { IProductRepository } from "../repositories/product.repository";
import { CreateProductDto } from "../dto/create-product.dto";
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { Product } from "../entities/product.entity";
import { ErrorHandlingService } from "../../../common/response/error-handling";
import { DataSource } from "typeorm";
import { getConnectionToken } from "@nestjs/mongoose";

// Mock for IProductRepository
const mockProductRepository = {
  create: jest.fn(),
  count: jest.fn(),
  countByModelName: jest.fn(),
  countByName: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  findByModelName: jest.fn(),
  findByName: jest.fn(),
  constructor: { name: "" },
};

// Mock for ErrorHandlingService
const mockErrorHandlingService = {
  returnErrorOnConflict: jest.fn((log, msg) => {
    throw new ConflictException(msg);
  }),
  returnErrorOnNotFound: jest.fn((log, msg) => {
    throw new NotFoundException(msg);
  }),
  returnErrorOnBadRequest: jest.fn((log, msg) => {
    throw new BadRequestException(msg);
  }),
  returnErrorOnInternalServerError: jest.fn((log, msg) => {
    throw new InternalServerErrorException(msg);
  }),
};

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    getRepository: jest.fn().mockReturnValue(mockProductRepository),
  },
};

const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
};

const mockMongooseSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

const mockMongooseConnection = {
  startSession: jest.fn().mockResolvedValue(mockMongooseSession),
};

describe("ProductsService", () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: IProductRepository,
          useValue: mockProductRepository,
        },
        {
          provide: ErrorHandlingService,
          useValue: mockErrorHandlingService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: getConnectionToken(),
          useValue: mockMongooseConnection,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("with PostgresProductRepository", () => {
    beforeEach(() => {
      mockProductRepository.constructor.name = "PostgresProductRepository";
    });

    describe("create", () => {
      const createProductDto: CreateProductDto = {
        name: "WaterGun 5000",
        modelName: "WG5000",
        quantity: 100,
        price: 10,
      };
      const expectedProduct: Product = {
        id: "1",
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      it("should create a product successfully", async () => {
        mockProductRepository.countByModelName.mockResolvedValue(0);
        mockProductRepository.countByName.mockResolvedValue(0);
        mockProductRepository.create.mockResolvedValue(expectedProduct);

        const result = await service.create(createProductDto);

        expect(result).toEqual(expectedProduct);
        expect(mockProductRepository.create).toHaveBeenCalledWith(
          createProductDto,
          expect.anything(),
        );
      });

      it("should throw a conflict exception if model name already exists", async () => {
        mockProductRepository.countByModelName.mockResolvedValue(1);
        await expect(service.create(createProductDto)).rejects.toThrow(
          ConflictException,
        );
      });

      it("should throw an internal server error if repository.create fails", async () => {
        mockProductRepository.countByModelName.mockResolvedValue(0);
        mockProductRepository.countByName.mockResolvedValue(0);
        mockProductRepository.create.mockRejectedValue(new Error("DB error"));
        await expect(service.create(createProductDto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });

    describe("sellProduct", () => {
      const productId = "some-uuid";
      const product: Product = {
        id: productId,
        name: "Test Product",
        modelName: "TP100",
        quantity: 10,
        price: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      it("should sell a product successfully", async () => {
        mockProductRepository.findById.mockResolvedValue(product);
        mockProductRepository.update.mockResolvedValue({
          ...product,
          quantity: 5,
        });
        const result = await service.sellProduct(productId, 5);
        expect(result.quantity).toBe(5);
        expect(mockProductRepository.update).toHaveBeenCalledWith(
          productId,
          { quantity: 5 },
          expect.anything(),
        );
      });

      it("should throw an internal server error if repository.findById fails", async () => {
        mockProductRepository.findById.mockRejectedValue(new Error("DB error"));
        await expect(service.sellProduct(productId, 5)).rejects.toThrow(Error);
      });
    });

    describe("updateStock", () => {
      const productId = "some-uuid";
      const product: Product = {
        id: productId,
        name: "Test Product",
        modelName: "TP100",
        quantity: 10,
        price: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      it("should update stock successfully", async () => {
        mockProductRepository.findById.mockResolvedValue(product);
        mockProductRepository.update.mockResolvedValue({
          ...product,
          quantity: 30,
        });
        const result = await service.updateStock(productId, 20);
        expect(result.quantity).toBe(30);
        expect(mockProductRepository.update).toHaveBeenCalledWith(
          productId,
          { quantity: 30 },
          expect.anything(),
        );
      });

      it("should throw an internal server error if repository.findById fails", async () => {
        mockProductRepository.findById.mockRejectedValue(new Error("DB error"));
        await expect(service.updateStock(productId, 5)).rejects.toThrow(Error);
      });
    });

    describe("remove", () => {
      const productId = "some-uuid";

      it("should remove a product", async () => {
        mockProductRepository.findById.mockResolvedValue({
          id: productId,
        } as Product);
        mockProductRepository.delete.mockResolvedValue(undefined);
        await service.remove(productId);
        expect(mockProductRepository.delete).toHaveBeenCalledWith(
          productId,
          expect.anything(),
        );
      });

      it("should throw an internal server error if repository fails", async () => {
        mockProductRepository.findById.mockRejectedValue(new Error("DB error"));
        await expect(service.remove(productId)).rejects.toThrow(Error);
      });
    });

    describe("Postgres Transactions", () => {
      it("should commit transaction on successful operation", async () => {
        const productId = "some-uuid";
        const product = { id: productId, quantity: 10 } as Product;
        mockProductRepository.findById.mockResolvedValue(product);
        mockProductRepository.update.mockResolvedValue({
          ...product,
          quantity: 5,
        });

        await service.sellProduct(productId, 5);

        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
      });

      it("should rollback transaction on failed operation", async () => {
        const productId = "some-uuid";
        mockProductRepository.findById.mockRejectedValue(new Error("DB Error"));

        await expect(service.sellProduct(productId, 5)).rejects.toThrow(
          "DB Error",
        );

        expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      });
    });
  });

  describe("with MongoProductRepository", () => {
    beforeEach(() => {
      mockProductRepository.constructor.name = "MongoProductRepository";
    });

    describe("Mongo Transactions", () => {
      it("should commit transaction on successful operation", async () => {
        const productId = "some-uuid";
        const product = { id: productId, quantity: 10 } as Product;
        mockProductRepository.findById.mockResolvedValue(product);
        mockProductRepository.update.mockResolvedValue({
          ...product,
          quantity: 5,
        });

        await service.sellProduct(productId, 5);

        expect(mockMongooseSession.commitTransaction).toHaveBeenCalled();
        expect(mockMongooseSession.abortTransaction).not.toHaveBeenCalled();
      });

      it("should rollback transaction on failed operation", async () => {
        const productId = "some-uuid";
        mockProductRepository.findById.mockRejectedValue(new Error("DB Error"));

        await expect(service.sellProduct(productId, 5)).rejects.toThrow(
          "DB Error",
        );

        expect(mockMongooseSession.commitTransaction).not.toHaveBeenCalled();
        expect(mockMongooseSession.abortTransaction).toHaveBeenCalled();
      });
    });
  });
});
