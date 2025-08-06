
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './services/products.service';
import { CreateProductDto } from './dto/create-product.dto';

// Mock du service pour isoler le contrôleur
const mockProductsService = {
  create: jest.fn(),
  getTotalStock: jest.fn(),
  getStockByModel: jest.fn(),
  remove: jest.fn(),
};

describe('ProductsController', () => {
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
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with the correct DTO', async () => {
      const createProductDto: CreateProductDto = { name: 'WaterBlaster', modelName: 'WB-1', quantity: 50 };
      await controller.create(createProductDto);
      expect(mockProductsService.create).toHaveBeenCalledWith(createProductDto);
    });
  });

  describe('getTotalStock', () => {
    it('should call service.getTotalStock', async () => {
      await controller.getTotalStock();
      expect(mockProductsService.getTotalStock).toHaveBeenCalled();
    });
  });

  describe('getStockByModel', () => {
    it('should call service.getStockByModel with the correct model name', async () => {
      const modelName = 'WB-1';
      await controller.getStockByModel(modelName);
      expect(mockProductsService.getStockByModel).toHaveBeenCalledWith(modelName);
    });
  });

  describe('remove', () => {
    it('should call service.remove with the correct id', async () => {
      const productId = 'some-id';
      await controller.remove(productId);
      expect(mockProductsService.remove).toHaveBeenCalledWith(productId);
    });
  });
});
