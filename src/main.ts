import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap()  {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuration de Swagger
  const config = new DocumentBuilder()
    .setTitle("Magasin X API")
    .setDescription(
      "API pour la gestion de magasin de pistolet à eau - Système de gestion des produits et utilisateurs",
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    customSiteTitle: "Magasin X API Documentation",
    customCss: `
      .swagger-ui .topbar { background-color: #2c3e50; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
