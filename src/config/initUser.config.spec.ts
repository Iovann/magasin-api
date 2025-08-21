import { InitUserConfig } from "./initUser.config";
import { validate } from "class-validator";

describe("InitUserConfig", () => {
  const createConfig = (
    envVars: Record<string, string> = {},
  ): InitUserConfig => {
    const config = new InitUserConfig();
    config.adminFirstName = envVars.ADMIN_FIRSTNAME || "admin";
    config.adminLastName = envVars.ADMIN_LASTNAME || "user";
    config.adminEmail = envVars.ADMIN_EMAIL || "admin@example.com";
    config.adminPassword = envVars.ADMIN_PASSWORD || "password";
    config.adminPhoneNumber = envVars.ADMIN_PHONENUMBER || "+33612345678";
    return config;
  };

  describe("Validation", () => {
    it("should validate a correct configuration", async () => {
      const config = createConfig({
        ADMIN_FIRSTNAME: "test",
        ADMIN_LASTNAME: "user",
        ADMIN_EMAIL: "test@example.com",
        ADMIN_PASSWORD: "password123",
        ADMIN_PHONENUMBER: "+33687654321",
      });
      const errors = await validate(config);
      expect(errors.length).toBe(0);
    });

    it("should fail if adminFirstName is missing", async () => {
      const config = new InitUserConfig();
      config.adminLastName = "user";
      config.adminEmail = "test@example.com";
      config.adminPassword = "password";
      config.adminPhoneNumber = "+33612345678";
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe("adminFirstName");
    });

    // Add similar tests for other missing fields...
  });

  describe("Environment Variables", () => {
    it("should load configuration from environment variables", () => {
      const config = createConfig({
        ADMIN_FIRSTNAME: "env_admin",
        ADMIN_LASTNAME: "env_user",
        ADMIN_EMAIL: "env@example.com",
        ADMIN_PASSWORD: "env_password",
        ADMIN_PHONENUMBER: "+33611223344",
      });
      expect(config.adminFirstName).toBe("env_admin");
      expect(config.adminLastName).toBe("env_user");
      expect(config.adminEmail).toBe("env@example.com");
      expect(config.adminPassword).toBe("env_password");
      expect(config.adminPhoneNumber).toBe("+33611223344");
    });
  });
});
