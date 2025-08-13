import { Module, DynamicModule, Provider, Global } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./services/users.service";
import { UserInitService } from "./services/user-init.service";
import { IUserRepository } from "./repositories/user.repository";
import { FsUserRepository } from "./repositories/fs-user.repository";
import { MongoUserRepository } from "./repositories/mongo-user.repository";
import { PostgresUserRepository } from "./repositories/postgres-user.repository";
import { DatabaseConfig } from "../../config/database.config";
import { MongooseModule, getModelToken } from "@nestjs/mongoose";
import { MongoUser, MongoUserSchema } from "./entities/mongo-user.entity";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { PostgresUser } from "./entities/postgres-user.entity";
import { Repository } from "typeorm";
import { Model } from "mongoose";

@Global()
@Module({})
export class UsersModule {
  static forRoot(): DynamicModule {
    const imports: any[] = [];
    const providers: Provider[] = [
      UsersService,
      UserInitService,
      DatabaseConfig,
    ];

    // Configuration conditionnelle des imports et providers
    switch (process.env.DB_TYPE) {
      case "postgres":
        imports.push(TypeOrmModule.forFeature([PostgresUser]));
        providers.push({
          provide: IUserRepository,
          useFactory: (repository: Repository<PostgresUser>) => {
            return new PostgresUserRepository(repository);
          },
          inject: [getRepositoryToken(PostgresUser)],
        });
        break;

      case "mongodb":
        imports.push(
          MongooseModule.forFeature([
            {
              name: MongoUser.name,
              schema: MongoUserSchema,
            },
          ]),
        );
        providers.push({
          provide: IUserRepository,
          useFactory: (model: Model<MongoUser>) => {
            return new MongoUserRepository(model);
          },
          inject: [getModelToken(MongoUser.name)],
        });
        break;

      default: // txt/filesystem
        providers.push({
          provide: IUserRepository,
          useFactory: (config: DatabaseConfig) => {
            return new FsUserRepository(config);
          },
          inject: [DatabaseConfig],
        });
        break;
    }

    return {
      module: UsersModule,
      imports,
      controllers: [UsersController],
      providers,
      exports: [IUserRepository, UsersService],
    };
  }
}
