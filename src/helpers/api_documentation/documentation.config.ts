import { DocumentBuilder, SwaggerCustomOptions } from "@nestjs/swagger";

export const CreateSwaggerConfig = () => {
  const config = new DocumentBuilder()
    .setTitle("FiduShare API")
    .setDescription("The FiduShare API description")
    .setVersion("1.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "JWT",
    )
    .setLicense("MIT", "https://opensource.org/licenses/MIT")
    .setContact(
      "FiduShare",
      "mailto:softvodooz@gmail.com",
      "softvodooz@gmail.com",
    )
    .build();

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      url: "/docs-json",
    },
  };

  return { config, customOptions };
};
