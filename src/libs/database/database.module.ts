import { DynamicModule, Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MongooseModule } from "@nestjs/mongoose";
import { EntityClassOrSchema } from "@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type";
import { ConfigifyModule } from "@itgorillaz/configify";
import { ConfigService } from "@nestjs/config";
import { PostgresProduct } from "../../core/products/entities/postgres-product.entity";
import { PostgresUser } from "../../core/users/entities/postgres-user.entity";

@Global()
@Module({})
export class DatabaseModule {
  static forRootAsync(): DynamicModule {
    const imports: any[] = [ConfigifyModule.forRootAsync()];

    if (process.env.DB_TYPE === "postgres") {
      imports.push(
        TypeOrmModule.forRootAsync({
          imports: [ConfigifyModule.forRootAsync()],
          useFactory: (configService: ConfigService) => {
            const config = {
              type: "postgres" as const,
              host: configService.getOrThrow("DB_HOST"),
              port: parseInt(configService.getOrThrow("DB_PORT")),
              username: configService.getOrThrow("DB_USER"),
              password: configService.getOrThrow("DB_PASSWORD"),
              database: configService.getOrThrow("DB_NAME"),
              entities: [PostgresProduct, PostgresUser],
              synchronize: configService.get("DB_SYNC") === "true",
            };

            return config;
          },
          inject: [ConfigService],
        }),
      );
    }

    if (process.env.DB_TYPE === "mongodb") {
      imports.push(
        MongooseModule.forRootAsync({
          imports: [ConfigifyModule.forRootAsync()],
          useFactory: (configService: ConfigService) => {
            const dbUser = configService.get("DB_USER");
            const dbPassword = configService.get("DB_PASSWORD");
            const dbHost = configService.getOrThrow("DB_HOST");
            const dbPort = configService.getOrThrow("DB_PORT");
            const dbName = configService.getOrThrow("DB_NAME");

            // Construct the URI based on credentials
            let uri: string;
            if (dbUser && dbPassword) {
              uri = `mongodb://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?authSource=admin`;
            } else {
              uri = `mongodb://${dbHost}:${dbPort}/${dbName}`;
            }

            return { uri };
          },
          inject: [ConfigService],
        }),
      );
    }

    if (process.env.DB_TYPE === "txt") {
      console.log("Using file-based database (txt). No ORM module needed.");
    }

    if (process.env.DB_TYPE === "duckdb") {
      console.log("Using DuckDB database. Configuration is handled by repository.");
    }

    return {
      module: DatabaseModule,
      imports,
    };
  }

  static forFeature(models: EntityClassOrSchema[]): DynamicModule {
    if (process.env.DB_TYPE === "postgres") {
      return TypeOrmModule.forFeature(models);
    } else if (process.env.DB_TYPE === "duckdb") {
      return {
        module: DatabaseModule,
        providers: [],
        exports: [],
      };
    } else {
      console.warn(
        "DatabaseModule.forFeature is primarily for TypeORM (Postgres).",
      );
      return {
        module: DatabaseModule,
        providers: [],
        exports: [],
      };
    }
  }
}
