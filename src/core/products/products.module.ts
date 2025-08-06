import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './services/products.service';
import { IProductRepository } from './repositories/product.repository';
import { FsProductRepository } from './repositories/fs-product.repository';
import { MongoProductRepository } from './repositories/mongo-product.repository';
import { PostgresProductRepository } from './repositories/postgres-product.repository';

const productRepositoryProvider = {
  provide: IProductRepository,
  useClass: (() => {
    switch (process.env.DB_TYPE) {
      case 'mongodb':
        return MongoProductRepository;
      case 'postgres':
        return PostgresProductRepository;
      default:
        return FsProductRepository;
    }
  })(),
};

@Module({
  imports: [],
  controllers: [ProductsController],
  providers: [ProductsService, productRepositoryProvider],
})
export class ProductsModule {}