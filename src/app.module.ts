import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigifyModule } from "@itgorillaz/configify";
import { ProductsModule } from "./core/products/products.module";
import { UsersModule } from "./core/users/users.module";
import { DatabaseModule } from "./libs/database/database.module";
import { ConfigModule } from "@nestjs/config";
import { ErrorHandlingModule } from "./common/response/error-handling.module";
import { AuthModule } from "./auth/auth.module";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { CacheModule } from "./libs/cache/cache.module";
import { TokenBlacklistModule } from "./auth/services/token-blacklist.module";
import { TokenRevocationInterceptor } from "./auth/interceptors/token-revocation.interceptor";
import { BcryptModule } from './utils/bcrypt/bcrypt.module';
import { WorkersModule } from './workers/worker.module';
@Module({
  imports: [
    ConfigifyModule.forRootAsync(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    DatabaseModule.forRootAsync(),
    ProductsModule.forRoot(),
    UsersModule.forRoot(),
    ErrorHandlingModule,
    TokenBlacklistModule,
    AuthModule,
    CacheModule,
    ThrottlerModule.forRoot(),
    BcryptModule,
    WorkersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TokenRevocationInterceptor,
    },
  ],
})
export class AppModule {}
