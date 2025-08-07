import { DynamicModule, Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { ConfigifyModule } from '@itgorillaz/configify';
import { ConfigService } from '@nestjs/config';
import { PostgresProduct } from '../core/products/entities/postgres-product.entity';
import { PostgresUser } from '../core/users/entities/postgres-user.entity';

@Global()
@Module({})
export class DatabaseModule {
  static forRootAsync(): DynamicModule {
    const imports: any[] = [ConfigifyModule.forRootAsync()];

    // Debug
    console.log('=== DEBUG ENV VARS ===');
    console.log('DB_TYPE:', process.env.DB_TYPE);

    if (process.env.DB_TYPE === 'postgres') {
      console.log('Adding PostgreSQL module...');
      console.log('Checking all environment variables:');
      console.log('NODE_ENV:', process.env.NODE_ENV);
      console.log('DB_HOST:', process.env.DB_HOST);
      console.log('DB_PORT:', process.env.DB_PORT);
      console.log('DB_USER:', process.env.DB_USER);
      console.log('DB_NAME:', process.env.DB_NAME);
      console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');
      imports.push(
        TypeOrmModule.forRootAsync({
          imports: [ConfigifyModule.forRootAsync()],
          useFactory: (configService: ConfigService) => {
            console.log('TypeORM Factory - getting config...');
            console.log('DB_HOST:', configService.get('DB_HOST'));
            console.log('DB_PORT:', configService.get('DB_PORT'));
            console.log('DB_USER:', configService.get('DB_USER'));
            console.log('DB_NAME:', configService.get('DB_NAME'));
            
            const config = {
              type: 'postgres' as const,
              host: configService.getOrThrow('DB_HOST'),
              port: parseInt(configService.getOrThrow('DB_PORT')),
              username: configService.getOrThrow('DB_USER'),
              password: configService.getOrThrow('DB_PASSWORD'),
              database: configService.getOrThrow('DB_NAME'),
              entities: [PostgresProduct, PostgresUser],
              synchronize: configService.get('DB_SYNC') === 'true',
              logging: true,
            };
            
            console.log('TypeORM Config:', JSON.stringify({...config, password: '[HIDDEN]'}, null, 2));
            return config;
          },
          inject: [ConfigService],
        })
      );
    }

    if (process.env.DB_TYPE === 'mongodb') {
      console.log('Adding MongoDB module...');
      imports.push(
        MongooseModule.forRootAsync({
          imports: [ConfigifyModule.forRootAsync()],
          useFactory: (configService: ConfigService) => {
            console.log('MongoDB Factory - getting config...');
            const dbUser = configService.get('DB_USER');
            const dbPassword = configService.get('DB_PASSWORD');
            const dbHost = configService.getOrThrow('DB_HOST');
            const dbPort = configService.getOrThrow('DB_PORT');
            const dbName = configService.getOrThrow('DB_NAME');
            
            // Construire l'URI selon si on a des credentials ou pas
            let uri;
            if (dbUser && dbPassword) {
              uri = `mongodb://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?authSource=admin`;
            } else {
              uri = `mongodb://${dbHost}:${dbPort}/${dbName}`;
            }
            
            console.log('MongoDB URI (without credentials):', uri.replace(/:\/\/.*:.*@/, '://***:***@'));
            return { uri };
          },
          inject: [ConfigService],
        })
      );
    }

    if (process.env.DB_TYPE === 'txt') {
      console.log('Using file-based database (txt). No ORM module needed.');
    }

    return {
      module: DatabaseModule,
      imports,
    };
  }

  static forFeature(models: EntityClassOrSchema[]): DynamicModule {
    if (process.env.DB_TYPE === 'postgres') {
      return TypeOrmModule.forFeature(models);
    } else {
      console.warn('DatabaseModule.forFeature is primarily for TypeORM (Postgres).');
      return { 
        module: DatabaseModule, 
        providers: [], 
        exports: [] 
      };
    }
  }
}