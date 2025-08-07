
import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductsService } from './services/products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SellProductDto } from './dto/sell-product.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
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
  @ApiOperation({ summary: 'Crée un nouveau produit (SuperAdmin, Magasinier)' })
  @ApiResponse({ status: 201, description: 'Le produit a été créé avec succès.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @ApiResponse({ status: 403, description: 'Accès refusé.' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get('stock')
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: 'Récupère le stock total de tous les produits' })
  @ApiResponse({ status: 200, description: 'Stock total retourné.' })
  getTotalStock() {
    return this.productsService.getTotalStock();
  }

  @Get('stock/:modelName')
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: 'Récupère le stock pour un modèle de produit spécifique' })
  @ApiResponse({ status: 200, description: 'Stock du modèle retourné.' })
  @ApiResponse({ status: 404, description: 'Modèle non trouvé.' })
  getStockByModel(@Param('modelName') modelName: string) {
    return this.productsService.getStockByModel(modelName);
  }

  @Delete(':id')
  @Roles(Role.SuperAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime un produit par son ID (SuperAdmin)' })
  @ApiResponse({ status: 204, description: 'Le produit a été supprimé avec succès.' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé.' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get(':id')
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: 'Récupère un produit par son ID' })
  @ApiResponse({ status: 200, description: 'Détails du produit retournés.' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé.' })
  getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Get()
  @Roles(Role.SuperAdmin, Role.Magasinier, Role.Vendeur)
  @ApiOperation({ summary: 'Récupère la liste de tous les produits' })
  @ApiResponse({ status: 200, description: 'Liste des produits retournée.' })
  getAllProducts() {
    return this.productsService.getAllProducts();
  }

  @Put(':id')
  @Roles(Role.SuperAdmin, Role.Magasinier)
  @ApiOperation({ summary: 'Met à jour la quantité de stock d\'un produit (SuperAdmin, Magasinier)' })
  @ApiResponse({ status: 200, description: 'Le stock a été mis à jour avec succès.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé.' })
  updateStock(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.updateStock(id, updateProductDto.quantity);
  }

  @Post(':id/sell')
  @Roles(Role.Vendeur)
  @ApiOperation({ summary: 'Vend une quantité de produit (Vendeur)' })
  @ApiResponse({ status: 200, description: 'Produit vendu avec succès.' })
  @ApiResponse({ status: 400, description: 'Quantité insuffisante en stock ou données invalides.' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé.' })
  sellProduct(@Param('id') id: string, @Body() sellProductDto: SellProductDto) {
    return this.productsService.sellProduct(id, sellProductDto.quantity);
  }
}
