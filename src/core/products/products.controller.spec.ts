import { Test, TestingModule } from "@nestjs/testing";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./services/products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { SellProductDto } from "./dto/sell-product.dto";
import { CacheInterceptor } from "@nestjs/cache-manager";
import { ThrottlerGuard } from "@nestjs/throttler";

// Mock of the service to isolate the controller
const mockProductsService = {
  create: jest.fn(),
  getTotalStock: jest.fn(),
  getStockByModel: jest.fn(),
  remove: jest.fn(),
  getProductById: jest.fn(),
  getAllProducts: jest.fn(),
  updateStock: jest.fn(),
  sellProduct: jest.fn(),
  getProductsByModelName: jest.fn(),
  getProductsByName: jest.fn(),
  countProductsByModelName: jest.fn(),
  countProductsByName: jest.fn(),
};

describe("ProductsController", () => {
  let controller: ProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    })
      .overrideInterceptor(CacheInterceptor)
      .useValue({ intercept: jest.fn() })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should call service.create with the correct DTO", async () => {
      const createProductDto: CreateProductDto = {
        name: "WaterBlaster",
        modelName: "WB-1",
        quantity: 50,
        price: 50,
      };
      await controller.create(createProductDto);
      expect(mockProductsService.create).toHaveBeenCalledWith(createProductDto);
    });
  });

  describe("getTotalStock", () => {
    it("should call service.getTotalStock", async () => {
      await controller.getTotalStock();
      expect(mockProductsService.getTotalStock).toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("should call service.remove with the correct id", async () => {
      const productId = "some-id";
      await controller.remove(productId);
      expect(mockProductsService.remove).toHaveBeenCalledWith(productId);
    });
  });

  describe("getProductById", () => {
    it("should call service.getProductById with the correct id", async () => {
      const productId = "some-id";
      await controller.getProductById(productId);
      expect(mockProductsService.getProductById).toHaveBeenCalledWith(
        productId,
      );
    });
  });

  describe("getAllProducts", () => {
    it("should call service.getAllProducts", async () => {
      await controller.getAllProducts();
      expect(mockProductsService.getAllProducts).toHaveBeenCalled();
    });
  });

  describe("updateStock", () => {
    it("should call service.updateStock with correct id and quantity", async () => {
      const productId = "some-id";
      const updateDto: UpdateProductDto = { quantity: 100, price: 20 };
      await controller.updateStock(productId, updateDto);
      expect(mockProductsService.updateStock).toHaveBeenCalledWith(
        productId,
        updateDto.quantity,
      );
    });
  });

  describe("sellProduct", () => {
    it("should call service.sellProduct with correct id and quantity", async () => {
      const productId = "some-id";
      const sellDto: SellProductDto = { quantity: 5 };
      await controller.sellProduct(productId, sellDto);
      expect(mockProductsService.sellProduct).toHaveBeenCalledWith(
        productId,
        sellDto.quantity,
      );
    });
  });

  describe("getProductsByModelName", () => {
    it("should call service.getProductsByModelName with correct model name", async () => {
      const modelName = "WB-1";
      await controller.getProductsByModelName(modelName);
      expect(mockProductsService.getProductsByModelName).toHaveBeenCalledWith(
        modelName,
      );
    });
  });

  describe("getProductsByName", () => {
    it("should call service.getProductsByName with correct name", async () => {
      const name = "WaterBlaster";
      await controller.getProductsByName(name);
      expect(mockProductsService.getProductsByName).toHaveBeenCalledWith(name);
    });
  });

  describe("countProductsByModelName", () => {
    it("should call service.countProductsByModelName with correct model name", async () => {
      const modelName = "WB-1";
      await controller.countProductsByModelName(modelName);
      expect(mockProductsService.countProductsByModelName).toHaveBeenCalledWith(
        modelName,
      );
    });
  });

  describe("countProductsByName", () => {
    it("should call service.countProductsByName with correct name", async () => {
      const name = "WaterBlaster";
      await controller.countProductsByName(name);
      expect(mockProductsService.countProductsByName).toHaveBeenCalledWith(
        name,
      );
    });
  });
});
