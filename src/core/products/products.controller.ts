
import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { ProductsService } from './services/products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enum/role.enum';

@Controller('products')
@UseGuards(AuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(Role.SuperAdmin)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get('stock')
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  getTotalStock() {
    return this.productsService.getTotalStock();
  }

  @Get('stock/:modelName')
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  getStockByModel(@Param('modelName') modelName: string) {
    return this.productsService.getStockByModel(modelName);
  }

  @Delete(':id')
  @Roles(Role.SuperAdmin)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get(':id')
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Get()
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  getAllProducts() {
    return this.productsService.getAllProducts();
  }

  @Put(':id')
  @Roles(Role.SuperAdmin, Role.Magasinier)
  updateStock(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.updateStock(id, updateProductDto.quantity);
  }

}
