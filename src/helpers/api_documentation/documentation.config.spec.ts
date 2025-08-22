import { CreateSwaggerConfig } from "./documentation.config";

describe("CreateSwaggerConfig", () => {
  it("should return config and customOptions", () => {
    const { config, customOptions } = CreateSwaggerConfig();

    expect(config).toBeDefined();
    expect(config.info.title).toBe("Magasin X API");
    expect(config.info.version).toBe("1.0");

    expect(customOptions).toBeDefined();
    expect(customOptions?.swaggerOptions?.url).toBe("/api/docs");
  });
});
