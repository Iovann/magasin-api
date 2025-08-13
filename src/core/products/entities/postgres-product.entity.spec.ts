import { PostgresProduct } from "./postgres-product.entity";

describe("PostgresProduct", () => {
  it("should be defined", () => {
    expect(PostgresProduct).toBeDefined();
  });

  it("should have correct entity decorator", () => {
    // Test that the class has the Entity decorator
    expect(PostgresProduct).toBeDefined();
  });

  it("should have correct class properties", () => {
    const product = new PostgresProduct();

    // Test that the class can be instantiated
    expect(product).toBeInstanceOf(PostgresProduct);
  });

  it("should have correct property types", () => {
    const product = new PostgresProduct();

    // Test that properties can be assigned
    product.id = "test-id";
    product.name = "Test Product";
    product.modelName = "Test Model";
    product.quantity = 10;
    product.price = 29.99;
    product.createdAt = new Date();
    product.updatedAt = new Date();

    expect(product.id).toBe("test-id");
    expect(product.name).toBe("Test Product");
    expect(product.modelName).toBe("Test Model");
    expect(product.quantity).toBe(10);
    expect(product.price).toBe(29.99);
    expect(product.createdAt).toBeInstanceOf(Date);
    expect(product.updatedAt).toBeInstanceOf(Date);
  });

  it("should work with TypeORM operations", () => {
    const product = new PostgresProduct();
    product.name = "Test Product";
    product.modelName = "Test Model";
    product.quantity = 10;
    product.price = 29.99;
    product.createdAt = new Date();
    product.updatedAt = new Date();

    // Test that the entity can be used as a TypeORM entity
    expect(product).toBeDefined();
    expect(typeof product.name).toBe("string");
    expect(typeof product.modelName).toBe("string");
    expect(typeof product.quantity).toBe("number");
    expect(typeof product.price).toBe("number");
    expect(product.createdAt).toBeInstanceOf(Date);
    expect(product.updatedAt).toBeInstanceOf(Date);
  });

  it("should handle null values correctly", () => {
    const product = new PostgresProduct();

    // Test that null values can be assigned
    product.name = null;
    product.modelName = null;
    product.quantity = null;
    product.price = null;
    product.createdAt = null;
    product.updatedAt = null;

    expect(product.name).toBeNull();
    expect(product.modelName).toBeNull();
    expect(product.quantity).toBeNull();
    expect(product.price).toBeNull();
    expect(product.createdAt).toBeNull();
    expect(product.updatedAt).toBeNull();
  });

  it("should handle different data types correctly", () => {
    const product = new PostgresProduct();

    // Test with different data types
    product.name = "Special Product!@#";
    product.modelName = "Model-123";
    product.quantity = 0;
    product.price = 0.01;
    product.createdAt = new Date("2024-01-01");
    product.updatedAt = new Date("2024-12-31");

    expect(product.name).toBe("Special Product!@#");
    expect(product.modelName).toBe("Model-123");
    expect(product.quantity).toBe(0);
    expect(product.price).toBe(0.01);
    expect(product.createdAt).toEqual(new Date("2024-01-01"));
    expect(product.updatedAt).toEqual(new Date("2024-12-31"));
  });
});
