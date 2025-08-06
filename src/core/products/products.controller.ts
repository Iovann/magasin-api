
import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ProductsService } from './services/products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get('stock')
  getTotalStock() {
    return this.productsService.getTotalStock();
  }

  @Get('stock/:modelName')
  getStockByModel(@Param('modelName') modelName: string) {
    return this.productsService.getStockByModel(modelName);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get(':id')
  getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Get()
  getAllProducts() {
    return this.productsService.getAllProducts();
  }

  @Put(':id')
  updateStock(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.updateStock(id, updateProductDto.quantity);
  }

}
