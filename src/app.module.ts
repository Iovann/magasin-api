import { DynamicModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigifyModule } from '@itgorillaz/configify';
import { DatabaseConfig } from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from './core/products/products.module';

const databaseModules: DynamicModule[] = [];

if (process.env.DB_TYPE === 'postgres') {
  databaseModules.push(
    TypeOrmModule.forRootAsync({
      useFactory: (config: DatabaseConfig) => ({
        type: 'postgres',
        host: config.dbHost,
        port: config.dbPort,
        username: config.dbUser,
        password: config.dbPassword,
        database: config.dbName,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.dbSync,
      }),
      inject: [DatabaseConfig],
    }),
  );
} else if (process.env.DB_TYPE === 'mongodb') {
  databaseModules.push(
    MongooseModule.forRootAsync({
      useFactory: (config: DatabaseConfig) => ({
        uri: `mongodb://${config.dbUser}:${config.dbPassword}@${config.dbHost}:${config.dbPort}/${config.dbName}`,
      }),
      inject: [DatabaseConfig],
    }),
  );
}


@Module({
  imports: [
    ConfigifyModule.forRootAsync(),
    ...databaseModules,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
