import { Test, TestingModule } from "@nestjs/testing";
import { ProductsService } from "./products.service";
import { IProductRepository } from "../repositories/product.repository";
import { ErrorHandlingService } from "../../../common/response/error-handling";
import { CreateProductDto } from "../dto/create-product.dto";
import { Product } from "../entities/product.entity";
import { Logger } from "winston";
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";

describe("ProductsService", () => {
  let service: ProductsService;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockErrorHandlingService: jest.Mocked<ErrorHandlingService>;
  let mockLogger: jest.Mocked<Logger>;

  const mockProduct: Product = {
    id: "1",
    name: "Test Product",
    modelName: "Test Model",
    quantity: 10,
    price: 29.99,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createProductDto: CreateProductDto = {
    name: "Test Product",
    modelName: "Test Model",
    quantity: 10,
    price: 29.99,
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      countByModelName: jest.fn(),
      countByName: jest.fn(),
      findByModelName: jest.fn(),
      findByName: jest.fn(),
    };

    const mockErrorService = {
      returnErrorOnConflict: jest.fn(),
      returnErrorOnInternalServerError: jest.fn(),
      returnErrorOnNotFound: jest.fn(),
      returnErrorOnBadRequest: jest.fn(),
    };

    const mockWinstonLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: IProductRepository,
          useValue: mockRepository,
        },
        {
          provide: ErrorHandlingService,
          useValue: mockErrorService,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockWinstonLogger,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    mockProductRepository = module.get(IProductRepository);
    mockErrorHandlingService = module.get(ErrorHandlingService);
    mockLogger = module.get(WINSTON_MODULE_PROVIDER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new product successfully", async () => {
      mockProductRepository.countByModelName.mockResolvedValue(0);
      mockProductRepository.create.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto);

      expect(mockProductRepository.countByModelName).toHaveBeenCalledWith(
        createProductDto.modelName,
      );
      expect(mockProductRepository.create).toHaveBeenCalledWith(
        createProductDto,
      );
      expect(result).toEqual(mockProduct);
      expect(mockLogger.log).toHaveBeenCalledWith({
        message: "Product created successfully",
        id: mockProduct.id,
      });
    });

    it("should throw conflict error when model name already exists", async () => {
      const conflictError = new ConflictException(
        "A product with this model already exists",
      );
      mockProductRepository.countByModelName.mockResolvedValue(1);
      mockErrorHandlingService.returnErrorOnConflict.mockImplementation(() => {
        throw conflictError;
      });

      await expect(service.create(createProductDto)).rejects.toThrow(
        ConflictException,
      );

      expect(mockProductRepository.countByModelName).toHaveBeenCalledWith(
        createProductDto.modelName,
      );
      expect(
        mockErrorHandlingService.returnErrorOnConflict,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_CREATE_MODEL_CONFLICT] Model Test Model already exists",
        "A product with this model already exists",
      );
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "Failed to create product",
      );
      mockProductRepository.countByModelName.mockResolvedValue(0);
      mockProductRepository.create.mockRejectedValue(
        new Error("Database error"),
      );
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.create(createProductDto)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_CREATE_CRITICAL] Critical error: Database error",
        "Failed to create product",
      );
    });
  });

  describe("getTotalStock", () => {
    it("should return total stock count successfully", async () => {
      mockProductRepository.count.mockResolvedValue(5);

      const result = await service.getTotalStock();

      expect(mockProductRepository.count).toHaveBeenCalled();
      expect(result).toEqual({ count: 5 });
      expect(mockLogger.log).toHaveBeenCalledWith({
        message: "Total stock count: 5",
      });
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while getting the total stock",
      );
      mockProductRepository.count.mockRejectedValue(
        new Error("Database error"),
      );
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.getTotalStock()).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_GET_TOTAL_STOCK] Error getting total stock: Database error",
        "An error occurred while getting the total stock",
      );
    });
  });

  describe("getAllProducts", () => {
    it("should return all products successfully", async () => {
      mockProductRepository.findAll.mockResolvedValue([mockProduct]);

      const result = await service.getAllProducts();

      expect(mockProductRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockProduct]);
      expect(mockLogger.log).toHaveBeenCalledWith({
        message: "Found 1 products",
      });
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while getting all products",
      );
      mockProductRepository.findAll.mockRejectedValue(
        new Error("Database error"),
      );
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.getAllProducts()).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_GET_ALL_PRODUCTS] Error getting all products: Database error",
        "An error occurred while getting all products",
      );
    });
  });

  describe("getProductById", () => {
    it("should return product when found", async () => {
      mockProductRepository.findById.mockResolvedValue(mockProduct);

      const result = await service.getProductById("1");

      expect(mockProductRepository.findById).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockProduct);
      expect(mockLogger.log).toHaveBeenCalledWith({
        message: `Found product with ID 1`,
        product: mockProduct,
      });
    });

    it("should return null when product not found", async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      const result = await service.getProductById("999");

      expect(mockProductRepository.findById).toHaveBeenCalledWith("999");
      expect(result).toBeNull();
      expect(mockLogger.log).toHaveBeenCalledWith({
        message: "Product with ID 999 not found",
      });
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while getting the product by ID",
      );
      mockProductRepository.findById.mockRejectedValue(
        new Error("Database error"),
      );
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.getProductById("1")).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_GET_PRODUCT_BY_ID] Error getting product by ID: Database error",
        "An error occurred while getting the product by ID",
      );
    });
  });

  describe("getStockByModel", () => {
    it("should return stock count for model successfully", async () => {
      mockProductRepository.countByModelName.mockResolvedValue(3);

      const result = await service.getStockByModel("Test Model");

      expect(mockProductRepository.countByModelName).toHaveBeenCalledWith(
        "Test Model",
      );
      expect(result).toEqual({ count: 3 });
      expect(mockLogger.log).toHaveBeenCalledWith({
        message: "Stock count for model Test Model: 3",
      });
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while getting the stock by model",
      );
      mockProductRepository.countByModelName.mockRejectedValue(
        new Error("Database error"),
      );
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.getStockByModel("Test Model")).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_GET_STOCK_BY_MODEL] Error getting stock by model: Database error",
        "An error occurred while getting the stock by model",
      );
    });
  });

  describe("sellProduct", () => {
    it("should sell product successfully when sufficient stock available", async () => {
      const updatedProduct = { ...mockProduct, quantity: 5 };
      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductRepository.update.mockResolvedValue(updatedProduct);

      const result = await service.sellProduct("1", 5);

      expect(mockProductRepository.findById).toHaveBeenCalledWith("1");
      expect(mockProductRepository.update).toHaveBeenCalledWith("1", {
        quantity: 5,
      });
      expect(result).toEqual(updatedProduct);
      expect(mockLogger.log).toHaveBeenCalledWith({
        message: "Product 1 sold successfully",
        quantitySold: 5,
        newStock: 5,
      });
    });

    it("should throw bad request error when quantity is zero", async () => {
      const badRequestError = new BadRequestException(
        "The quantity must be positive",
      );
      mockErrorHandlingService.returnErrorOnBadRequest.mockImplementation(
        () => {
          throw badRequestError;
        },
      );

      await expect(service.sellProduct("1", 0)).rejects.toThrow(
        BadRequestException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnBadRequest,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_SELL_INVALID_QTY] Invalid quantity: 0",
        "The quantity must be positive",
      );
    });

    it("should throw bad request error when quantity is negative", async () => {
      const badRequestError = new BadRequestException(
        "The quantity must be positive",
      );
      mockErrorHandlingService.returnErrorOnBadRequest.mockImplementation(
        () => {
          throw badRequestError;
        },
      );

      await expect(service.sellProduct("1", -5)).rejects.toThrow(
        BadRequestException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnBadRequest,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_SELL_INVALID_QTY] Invalid quantity: -5",
        "The quantity must be positive",
      );
    });

    it("should throw not found error when product does not exist", async () => {
      const notFoundError = new NotFoundException("Product not found");
      mockProductRepository.findById.mockResolvedValue(null);
      mockErrorHandlingService.returnErrorOnNotFound.mockImplementation(() => {
        throw notFoundError;
      });

      await expect(service.sellProduct("999", 5)).rejects.toThrow(
        NotFoundException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnNotFound,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_SELL_NOT_FOUND] Product 999 not found",
        "Product not found",
      );
    });

    it("should throw bad request error when insufficient stock", async () => {
      const badRequestError = new BadRequestException(
        "Insufficient stock for Test Product. Available quantity: 10",
      );
      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockErrorHandlingService.returnErrorOnBadRequest.mockImplementation(
        () => {
          throw badRequestError;
        },
      );

      await expect(service.sellProduct("1", 15)).rejects.toThrow(
        BadRequestException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnBadRequest,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_SELL_INSUFFICIENT_STOCK] Insufficient stock for Test Product",
        "Insufficient stock for Test Product. Available quantity: 10",
      );
    });

    // it('should throw not found error when update returns null', async () => {
    //   const mockProduct = {
    //     id: '1',
    //     name: 'Test Product',
    //     modelName: 'Test Model',
    //     price: 29.99,
    //     quantity: 10,
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   };

    //   mockProductRepository.findById.mockResolvedValue(mockProduct);
    //   mockProductRepository.update.mockResolvedValue(null);

    //   await expect(service.sellProduct('1', 5)).rejects.toThrow(NotFoundException);

    //   expect(mockErrorHandlingService.returnErrorOnNotFound).toHaveBeenCalledWith(
    //     '[ERR_PROD_UPDATE_FAILED] Failed to update product 1',
    //     'Failed to update product'
    //   );
    // });

    it("should throw internal server error when update throws error", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while processing the sale",
      );
      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductRepository.update.mockRejectedValue(
        new Error("Update failed"),
      );
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.sellProduct("1", 5)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_SELL_CRITICAL] Critical error during sale: Update failed",
        "An error occurred while processing the sale",
      );
    });
  });

  describe("updateStock", () => {
    it("should update stock successfully when adding positive quantity", async () => {
      const updatedProduct = { ...mockProduct, quantity: 15 };
      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductRepository.update.mockResolvedValue(updatedProduct);

      const result = await service.updateStock("1", 5);

      expect(mockProductRepository.findById).toHaveBeenCalledWith("1");
      expect(mockProductRepository.update).toHaveBeenCalledWith("1", {
        quantity: 15,
      });
      expect(result).toEqual(updatedProduct);
      expect(mockLogger.log).toHaveBeenCalledWith({
        message: "Stock for product 1 updated successfully",
        newStock: 15,
      });
    });

    it("should throw bad request error when quantity is negative", async () => {
      const badRequestError = new BadRequestException(
        "Quantity cannot be negative",
      );
      mockErrorHandlingService.returnErrorOnBadRequest.mockImplementation(
        () => {
          throw badRequestError;
        },
      );

      await expect(service.updateStock("1", -5)).rejects.toThrow(
        BadRequestException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnBadRequest,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_UPDATE_NEGATIVE_QTY] Negative quantity: -5",
        "Quantity cannot be negative",
      );
    });

    it("should throw not found error when product does not exist", async () => {
      const notFoundError = new NotFoundException("Product not found");
      mockProductRepository.findById.mockResolvedValue(null);
      mockErrorHandlingService.returnErrorOnNotFound.mockImplementation(() => {
        throw notFoundError;
      });

      await expect(service.updateStock("999", 5)).rejects.toThrow(
        NotFoundException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnNotFound,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_UPDATE_NOT_FOUND] Product 999 not found",
        "Product not found",
      );
    });

    // it('should throw error when update fails', async () => {
    //   const mockProduct = {
    //     id: '1',
    //     name: 'Test Product',
    //     modelName: 'Test Model',
    //     price: 29.99,
    //     quantity: 10,
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   };

    //   mockProductRepository.findById.mockResolvedValue(mockProduct);
    //   mockProductRepository.update.mockResolvedValue(null);

    //   await expect(service.updateStock('1', 5)).rejects.toThrow(InternalServerErrorException);

    //   expect(mockErrorHandlingService.returnErrorOnInternalServerError).toHaveBeenCalledWith(
    //     '[ERR_PROD_UPDATE_STOCK_CRITICAL] Critical error: Failed to update product stock',
    //     'An error occurred while updating the stock'
    //   );
    // });

    it("should throw internal server error when update throws error", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while updating the stock",
      );
      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductRepository.update.mockRejectedValue(
        new Error("Update failed"),
      );
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.updateStock("1", 5)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_UPDATE_STOCK_CRITICAL] Critical error: Update failed",
        "An error occurred while updating the stock",
      );
    });
  });

  describe("getProductsByModelName", () => {
    it("should return products by model name successfully", async () => {
      mockProductRepository.findByModelName.mockResolvedValue([mockProduct]);

      const result = await service.getProductsByModelName("Test Model");

      expect(mockProductRepository.findByModelName).toHaveBeenCalledWith(
        "Test Model",
      );
      expect(result).toEqual([mockProduct]);
      expect(mockLogger.log).toHaveBeenCalledWith({
        message: "Found 1 products for model Test Model",
      });
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while getting the products by model name",
      );
      mockProductRepository.findByModelName.mockRejectedValue(
        new Error("Database error"),
      );
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(
        service.getProductsByModelName("Test Model"),
      ).rejects.toThrow(InternalServerErrorException);

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_GET_PRODUCTS_BY_MODEL_NAME] Error getting products by model name: Database error",
        "An error occurred while getting the products by model name",
      );
    });
  });

  describe("getProductsByName", () => {
    it("should return products by name successfully", async () => {
      mockProductRepository.findByName.mockResolvedValue([mockProduct]);

      const result = await service.getProductsByName("Test Product");

      expect(mockProductRepository.findByName).toHaveBeenCalledWith(
        "Test Product",
      );
      expect(result).toEqual([mockProduct]);
      expect(mockLogger.log).toHaveBeenCalledWith({
        message: "Found 1 products for name Test Product",
      });
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while getting the products by name",
      );
      mockProductRepository.findByName.mockRejectedValue(
        new Error("Database error"),
      );
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.getProductsByName("Test Product")).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_GET_PRODUCTS_BY_NAME] Error getting products by name: Database error",
        "An error occurred while getting the products by name",
      );
    });
  });

  describe("countProductsByModelName", () => {
    it("should count products by model name successfully", async () => {
      mockProductRepository.countByModelName.mockResolvedValue(3);

      const result = await service.countProductsByModelName("Test Model");

      expect(mockProductRepository.countByModelName).toHaveBeenCalledWith(
        "Test Model",
      );
      expect(result).toEqual({ count: 3 });
      expect(mockLogger.log).toHaveBeenCalledWith({
        message: "Count for model Test Model: 3",
      });
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while counting the products by model name",
      );
      mockProductRepository.countByModelName.mockRejectedValue(
        new Error("Database error"),
      );
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(
        service.countProductsByModelName("Test Model"),
      ).rejects.toThrow(InternalServerErrorException);

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_COUNT_PRODUCTS_BY_MODEL_NAME] Error counting products by model name: Database error",
        "An error occurred while counting the products by model name",
      );
    });
  });

  describe("countProductsByName", () => {
    it("should count products by name successfully", async () => {
      mockProductRepository.countByName.mockResolvedValue(2);

      const result = await service.countProductsByName("Test Product");

      expect(mockProductRepository.countByName).toHaveBeenCalledWith(
        "Test Product",
      );
      expect(result).toEqual({ count: 2 });
      expect(mockLogger.log).toHaveBeenCalledWith({
        message: "Count for name Test Product: 2",
      });
    });

    it("should throw internal server error when repository fails", async () => {
      const internalError = new InternalServerErrorException(
        "An error occurred while counting the products by name",
      );
      mockProductRepository.countByName.mockRejectedValue(
        new Error("Database error"),
      );
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.countProductsByName("Test Product")).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_COUNT_PRODUCTS_BY_NAME] Error counting products by name: Database error",
        "An error occurred while counting the products by name",
      );
    });
  });

  describe("remove", () => {
    it("should remove product successfully", async () => {
      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductRepository.delete.mockResolvedValue(undefined);

      await service.remove("1");

      expect(mockProductRepository.findById).toHaveBeenCalledWith("1");
      expect(mockProductRepository.delete).toHaveBeenCalledWith("1");
      expect(mockLogger.log).toHaveBeenCalledWith({
        message: "Product 1 removed successfully",
      });
    });

    it("should throw not found error when product does not exist", async () => {
      const notFoundError = new NotFoundException("Product not found");
      mockProductRepository.findById.mockResolvedValue(null);
      mockErrorHandlingService.returnErrorOnNotFound.mockImplementation(() => {
        throw notFoundError;
      });

      await expect(service.remove("999")).rejects.toThrow(NotFoundException);

      expect(
        mockErrorHandlingService.returnErrorOnNotFound,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_REMOVE_NOT_FOUND] Product 999 not found",
        "Product not found",
      );
    });

    it("should throw internal server error when delete fails", async () => {
      const internalError = new InternalServerErrorException(
        "Failed to delete product",
      );
      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductRepository.delete.mockRejectedValue(
        new Error("Delete failed"),
      );
      mockErrorHandlingService.returnErrorOnInternalServerError.mockImplementation(
        () => {
          throw internalError;
        },
      );

      await expect(service.remove("1")).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(
        mockErrorHandlingService.returnErrorOnInternalServerError,
      ).toHaveBeenCalledWith(
        "[ERR_PROD_REMOVE_CRITICAL] Critical error: Delete failed",
        "Failed to delete product",
      );
    });
  });
});
