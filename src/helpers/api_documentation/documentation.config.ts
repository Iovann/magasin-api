import { DocumentBuilder, SwaggerCustomOptions } from "@nestjs/swagger";

export const CreateSwaggerConfig = () => {
  const config = new DocumentBuilder()
  .setTitle("Magasin X API")
  .setDescription(
    "API pour la gestion de magasin - Système de gestion des produits et utilisateurs",
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

  const customOptions: SwaggerCustomOptions = {
    customSiteTitle: "Magasin X API Documentation",
    customCss: `
      .swagger-ui .topbar { background-color: #2c3e50; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
    `,
    swaggerOptions: {
      url: '/api/docs',
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  };

  return { config, customOptions };
};