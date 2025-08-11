import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigifyModule } from "@itgorillaz/configify";
import { ProductsModule } from "./core/products/products.module";
import { UsersModule } from "./core/users/users.module";
import { DatabaseModule } from "./database/database.module";
import { ConfigModule } from "@nestjs/config";
import { ErrorHandlingModule } from "./common/response/error-handling.module";

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
