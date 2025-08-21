import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseModule } from "./database.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigService } from "@nestjs/config";

// Mocking the modules
jest.mock("@nestjs/typeorm", () => ({
  TypeOrmModule: {
    forRootAsync: jest.fn(),
    forFeature: jest.fn(),
  },
}));

jest.mock("@nestjs/mongoose", () => ({
  MongooseModule: {
    forRootAsync: jest.fn(),
  },
}));

describe("DatabaseModule", () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
      getOrThrow: jest.fn(),
    } as any;
  });

  afterEach(() => {
    delete process.env.DB_TYPE;
    jest.clearAllMocks();
  });

  describe("forRootAsync", () => {
    it("should configure TypeOrmModule for postgres", () => {
      process.env.DB_TYPE = "postgres";
      DatabaseModule.forRootAsync();
      expect(TypeOrmModule.forRootAsync).toHaveBeenCalled();
    });

    it("should configure MongooseModule for mongodb", () => {
      process.env.DB_TYPE = "mongodb";
      DatabaseModule.forRootAsync();
      expect(MongooseModule.forRootAsync).toHaveBeenCalled();
    });

    it("should handle txt DB_TYPE", () => {
      process.env.DB_TYPE = "txt";
      const module = DatabaseModule.forRootAsync();
      expect(module.imports).toHaveLength(1); // Only ConfigifyModule
    });

    it("should handle duckdb DB_TYPE", () => {
      process.env.DB_TYPE = "duckdb";
      const module = DatabaseModule.forRootAsync();
      expect(module.imports).toHaveLength(1); // Only ConfigifyModule
    });
  });

  describe("forFeature", () => {
    it("should return TypeOrmModule.forFeature for postgres", () => {
      process.env.DB_TYPE = "postgres";
      const models = [];
      DatabaseModule.forFeature(models);
      expect(TypeOrmModule.forFeature).toHaveBeenCalledWith(models);
    });

    it("should return a simple module for duckdb", () => {
      process.env.DB_TYPE = "duckdb";
      const module = DatabaseModule.forFeature([]);
      expect(module.module).toBe(DatabaseModule);
      expect(TypeOrmModule.forFeature).not.toHaveBeenCalled();
    });

    it("should return a simple module and warn for other types", () => {
      process.env.DB_TYPE = "mongodb";
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      const module = DatabaseModule.forFeature([]);
      expect(module.module).toBe(DatabaseModule);
      expect(TypeOrmModule.forFeature).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });
});
