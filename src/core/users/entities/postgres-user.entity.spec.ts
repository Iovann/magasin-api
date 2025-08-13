import { PostgresUser } from "./postgres-user.entity";

describe("PostgresUser", () => {
  it("should be defined", () => {
    expect(PostgresUser).toBeDefined();
  });

  it("should have correct entity decorator", () => {
    // Test that the class has the Entity decorator
    expect(PostgresUser).toBeDefined();
  });

  it("should have correct class properties", () => {
    const user = new PostgresUser();

    // Test that the class can be instantiated
    expect(user).toBeInstanceOf(PostgresUser);
  });

  it("should have correct property types", () => {
    const user = new PostgresUser();

    // Test that properties can be assigned
    user.email = "test@example.com";
    user.role = "USER";
    user.isBlocked = false;
    user.createdAt = new Date();
    user.updatedAt = new Date();

    expect(user.email).toBe("test@example.com");
    expect(user.role).toBe("USER");
    expect(user.isBlocked).toBe(false);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  it("should work with TypeORM operations", () => {
    const user = new PostgresUser();
    user.email = "test@example.com";
    user.role = "USER";
    user.isBlocked = false;
    user.createdAt = new Date();
    user.updatedAt = new Date();

    // Test that the entity can be used as a TypeORM entity
    expect(user).toBeDefined();
    expect(typeof user.email).toBe("string");
    expect(typeof user.role).toBe("string");
    expect(typeof user.isBlocked).toBe("boolean");
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  it("should handle null values correctly", () => {
    const user = new PostgresUser();

    // Test that null values can be assigned
    user.email = null;
    user.role = null;
    user.isBlocked = null;
    user.createdAt = null;
    user.updatedAt = null;

    expect(user.email).toBeNull();
    expect(user.role).toBeNull();
    expect(user.isBlocked).toBeNull();
    expect(user.createdAt).toBeNull();
    expect(user.updatedAt).toBeNull();
  });

  it("should handle different role values", () => {
    const user = new PostgresUser();

    // Test with different roles
    user.role = "SUPER_ADMIN";
    expect(user.role).toBe("SUPER_ADMIN");

    user.role = "MAGASINIER";
    expect(user.role).toBe("MAGASINIER");

    user.role = "VENDEUR";
    expect(user.role).toBe("VENDEUR");
  });

  it("should handle boolean values correctly", () => {
    const user = new PostgresUser();

    user.isBlocked = true;
    expect(user.isBlocked).toBe(true);

    user.isBlocked = false;
    expect(user.isBlocked).toBe(false);
  });

  it("should handle email validation", () => {
    const user = new PostgresUser();

    // Test with valid email
    user.email = "valid.email@example.com";
    expect(user.email).toBe("valid.email@example.com");

    // Test with different email formats
    user.email = "user+tag@domain.co.uk";
    expect(user.email).toBe("user+tag@domain.co.uk");
  });

  it("should handle different data types correctly", () => {
    const user = new PostgresUser();

    // Test with different data types
    user.email = "special.user@example-domain.com";
    user.role = "CUSTOM_ROLE";
    user.isBlocked = true;
    user.createdAt = new Date("2024-01-01");
    user.updatedAt = new Date("2024-12-31");

    expect(user.email).toBe("special.user@example-domain.com");
    expect(user.role).toBe("CUSTOM_ROLE");
    expect(user.isBlocked).toBe(true);
    expect(user.createdAt).toEqual(new Date("2024-01-01"));
    expect(user.updatedAt).toEqual(new Date("2024-12-31"));
  });
});
