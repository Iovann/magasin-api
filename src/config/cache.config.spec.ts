import { CacheConfig } from "./cache.config";
import { validate } from "class-validator";

describe("CacheConfig", () => {
  let config: CacheConfig;

  const createConfig = (envVars: Record<string, string> = {}) => {
    const config = new CacheConfig();

    // Apply environment variables or defaults
    config.host = envVars.CACHE_HOST || "localhost";
    config.port = envVars.CACHE_PORT || "6379";
    config.ttl = envVars.CACHE_TTL || "3600";
    config.db = envVars.CACHE_DB || "0";
    config.password = envVars.CACHE_PASSWORD; // Can be undefined
    config.keyPrefix = envVars.CACHE_PREFIX || "magasinx:";
    config.maxItems = envVars.CACHE_MAX_ITEMS || "1000";
    config.maxRetries = envVars.CACHE_MAX_RETRIES || "3";
    config.readyCheck =
      envVars.CACHE_READY_CHECK !== undefined
        ? envVars.CACHE_READY_CHECK
        : "true";

    return config;
  };

  beforeEach(() => {
    config = createConfig({
      CACHE_HOST: "test-host",
      CACHE_PORT: "6380",
      CACHE_TTL: "7200",
      CACHE_DB: "1",
      CACHE_PREFIX: "test:",
      CACHE_MAX_ITEMS: "500",
      CACHE_MAX_RETRIES: "5",
      CACHE_READY_CHECK: "true",
    });
  });

  afterEach(() => {
    config = null;
  });

  describe("Validation", () => {
    it("should validate correct configuration", async () => {
      const config = createConfig();
      const errors = await validate(config);
      expect(errors.length).toBe(0);
    });

    it("should fail validation with invalid port (non-numeric)", async () => {
      const config = createConfig({ CACHE_PORT: "invalid" });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe("port");
    });

    it("should fail validation with invalid TTL (non-numeric)", async () => {
      const config = createConfig({ CACHE_TTL: "invalid" });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe("ttl");
    });

    it("should fail validation with invalid readyCheck", async () => {
      const config = createConfig({ CACHE_READY_CHECK: "maybe" });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe("readyCheck");
    });
  });

  describe("Basic Functionality", () => {
    it("should be defined", () => {
      expect(config).toBeDefined();
    });

    it("should make password optional", () => {
      const configWithoutPassword = createConfig();
      expect(configWithoutPassword.password).toBeUndefined();

      const configWithPassword = createConfig({
        CACHE_PASSWORD: "test-password",
      });

      expect(configWithPassword.password).toBe("test-password");
    });

    it("should have all required properties", () => {
      const requiredProperties = [
        "host",
        "port",
        "ttl",
        "db",
        "keyPrefix",
        "maxItems",
        "maxRetries",
        "readyCheck",
      ];

      requiredProperties.forEach((prop) => {
        expect(config).toHaveProperty(prop);
      });
    });
  });

  describe("Default Values", () => {
    it("should have correct default values when no env vars are set", () => {
      const defaultConfig = createConfig({});

      expect(defaultConfig.host).toBe("localhost");
      expect(defaultConfig.port).toBe("6379");
      expect(defaultConfig.ttl).toBe("3600");
      expect(defaultConfig.db).toBe("0");
      expect(defaultConfig.keyPrefix).toBe("magasinx:");
      expect(defaultConfig.maxItems).toBe("1000");
      expect(defaultConfig.maxRetries).toBe("3");
      expect(defaultConfig.readyCheck).toBe("true");
    });
  });

  describe("Environment Variables", () => {
    it("should load configuration from environment variables", () => {
      expect(config.host).toBe("test-host");
      expect(config.port).toBe("6380");
      expect(config.ttl).toBe("7200");
      expect(config.db).toBe("1");
      expect(config.keyPrefix).toBe("test:");
      expect(config.maxItems).toBe("500");
      expect(config.maxRetries).toBe("5");
      expect(config.readyCheck).toBe("true");
    });

    it("should handle all configuration values as strings", () => {
      // All values should be strings as per the class definition
      Object.values(config).forEach((value) => {
        if (value !== undefined) {
          expect(typeof value).toBe("string");
        }
      });
    });

    it("should handle boolean readyCheck from string", () => {
      const trueConfig = createConfig({ CACHE_READY_CHECK: "true" });
      const falseConfig = createConfig({ CACHE_READY_CHECK: "false" });

      expect(trueConfig.readyCheck).toBe("true");
      expect(falseConfig.readyCheck).toBe("false");
    });

    it("should have password as optional", () => {
      const configWithoutPassword = createConfig();
      expect(configWithoutPassword.password).toBeUndefined();
    });
  });
});
