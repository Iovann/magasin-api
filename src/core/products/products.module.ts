import { Module, DynamicModule, Provider } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./services/products.service";
import { IProductRepository } from "./repositories/product.repository";
import { FsProductRepository } from "./repositories/fs-product.repository";
import { MongoProductRepository } from "./repositories/mongo-product.repository";
import { PostgresProductRepository } from "./repositories/postgres-product.repository";
import { DatabaseConfig } from "../../config/database.config";
import { MongooseModule, getModelToken } from "@nestjs/mongoose";
import {
  MongoProduct,
  MongoProductSchema,
} from "./entities/mongo-product.entity";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { PostgresProduct } from "./entities/postgres-product.entity";
import { Repository } from "typeorm";
import { Model } from "mongoose";
import { CacheModule } from "../../libs/cache/cache.module";
import { DuckDBProductRepository } from "./repositories/duckdb-product.reposetory";

@Module({})
export class ProductsModule {
  static forRoot(): DynamicModule {
    const imports: any[] = [CacheModule]; // Plus besoin d'importer ErrorHandlingModule car il est global
    const providers: Provider[] = [ProductsService, DatabaseConfig];

    // Configuration conditionnelle des imports et providers
    switch (process.env.DB_TYPE) {
      case "postgres":
        imports.push(TypeOrmModule.forFeature([PostgresProduct]));
        providers.push({
          provide: IProductRepository,
          useFactory: (repository: Repository<PostgresProduct>) => {
            return new PostgresProductRepository(repository);
          },
          inject: [getRepositoryToken(PostgresProduct)],
        });
        break;

      case "mongodb":
        imports.push(
          MongooseModule.forFeature([
            {
              name: MongoProduct.name,
              schema: MongoProductSchema,
            },
          ]),
        );
        providers.push({
          provide: IProductRepository,
          useFactory: (model: Model<MongoProduct>) => {
            return new MongoProductRepository(model);
          },
          inject: [getModelToken(MongoProduct.name)],
        });
        break;

      case "txt":
        providers.push({
          provide: IProductRepository,
          useClass: FsProductRepository,
        });
        break;

      case "duckdb":
        providers.push({
          provide: IProductRepository,
          useClass: DuckDBProductRepository,
        });
        break;

      default: // filesystem
        providers.push({
          provide: IProductRepository,
          useFactory: (config: DatabaseConfig) => {
            return new FsProductRepository(config);
          },
          inject: [DatabaseConfig],
        });
        break;
    }

    return {
      module: ProductsModule,
      imports,
      controllers: [ProductsController],
      providers,
      exports: [IProductRepository],
    };
  }
}
