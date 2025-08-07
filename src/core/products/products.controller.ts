
import { Controller, Get, Post, Body, Param, Delete, Put, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductsService } from './services/products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SellProductDto } from './dto/sell-product.dto';
// import { AuthGuard } from '../../common/guards/auth.guard';
// import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enum/role.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('products')
@ApiBearerAuth('JWT-auth')
// @UseGuards(AuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(Role.SuperAdmin, Role.Magasinier)
  @ApiOperation({ summary: 'Crée un nouveau modèle de pistolet (SuperAdmin, Magasinier)' })
  @ApiResponse({ status: 201, description: 'Le pistolet a été créé avec succès.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @ApiResponse({ status: 403, description: 'Accès refusé.' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get('stock')
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: 'Récupère le nombre total de tous les pistolets à eau' })
  @ApiResponse({ status: 200, description: 'Nombre total de pistolets à eau retourné.' })
  getTotalStock() {
    return this.productsService.getTotalStock();
  }

  // @Get('stock/:modelName')
  // @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  // @ApiOperation({ summary: 'Récupère le stock pour un modèle de pistolet spécifique' })
  // @ApiResponse({ status: 200, description: 'Stock du modèle retourné.' })
  // @ApiResponse({ status: 404, description: 'Modèle non trouvé.' })
  // getStockByModel(@Param('mo  delName') modelName: string) {
  //   return this.productsService.getStockByModel(modelName);
  // }

  @Delete(':id')
  @Roles(Role.SuperAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime un modèle de pistolet par son ID (SuperAdmin)' })
  @ApiResponse({ status: 204, description: 'Le modèle de pistolet a été supprimé avec succès.' })
  @ApiResponse({ status: 404, description: 'Modèle de pistolet non trouvé.' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get(':id')
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: 'Récupère un modèle de pistolet par son ID' })
  @ApiResponse({ status: 200, description: 'Détails du modèle de pistolet retournés.' })
  @ApiResponse({ status: 404, description: 'Modèle de pistolet non trouvé.' })
  getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Get()
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: 'Récupère la liste de tous les pistolets à eau' })
  @ApiResponse({ status: 200, description: 'Liste des pistolets à eau retournée.' })
  getAllProducts() {
    return this.productsService.getAllProducts();
  }

  @Put(':id')
  @Roles(Role.SuperAdmin, Role.Magasinier)
  @ApiOperation({ summary: 'Met à jour la quantité de stock d\'un modèle de pistolet (SuperAdmin, Magasinier)' })
  @ApiResponse({ status: 200, description: 'Le stock a été mis à jour avec succès.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @ApiResponse({ status: 404, description: 'Modèle de pistolet non trouvé.' })
  updateStock(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.updateStock(id, updateProductDto.quantity);
  }

  @Post(':id/sell')
  @Roles(Role.Vendeur)
  @ApiOperation({ summary: 'Vend une quantité de modèle de pistolet (Vendeur)' })
  @ApiResponse({ status: 200, description: 'Modèle de pistolet vendu avec succès.' })
  @ApiResponse({ status: 400, description: 'Quantité insuffisante en stock ou données invalides.' })
  @ApiResponse({ status: 404, description: 'Modèle de pistolet non trouvé.' })
  sellProduct(@Param('id') id: string, @Body() sellProductDto: SellProductDto) {
    return this.productsService.sellProduct(id, sellProductDto.quantity);
  }

  @Get('by-model/:modelName')
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: 'Récupère tous les pistolets à eau par nom de modèle' })
  @ApiResponse({ status: 200, description: 'Liste des pistolets à eau par modèle retournée.' })
  getProductsByModelName(@Param('modelName') modelName: string) {
    return this.productsService.getProductsByModelName(modelName);
  }

  @Get('by-name/:name')
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: 'Récupère tous les pistolets à eau par nom' })
  @ApiResponse({ status: 200, description: 'Liste des pistolets à eau par nom retournée.' })
  getProductsByName(@Param('name') name: string) {
    return this.productsService.getProductsByName(name);
  }

  @Get('count-by-model/:modelName')
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: 'Compte le nombre de pistolets à eau par nom de modèle' })
  @ApiResponse({ status: 200, description: 'Nombre de pistolets à eau par modèle retourné.' })
  countProductsByModelName(@Param('modelName') modelName: string) {
    return this.productsService.countProductsByModelName(modelName);
  }

  @Get('count-by-name/:name')
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: 'Compte le nombre de pistolets à eau par nom' })
  @ApiResponse({ status: 200, description: 'Nombre de pistolets à eau par nom retourné.' })
  countProductsByName(@Param('name') name: string) {
    return this.productsService.countProductsByName(name);
  }
}
