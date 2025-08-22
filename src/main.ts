import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { WinstonModule } from "nest-winston";
import { CreateSwaggerConfig } from "./helpers/api_documentation/documentation.config";
import { SwaggerModule } from "@nestjs/swagger";
import { winstonConfig } from "./config/winston.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig)
  });

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger  configuration 
  const { config, customOptions } = CreateSwaggerConfig();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, customOptions);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
