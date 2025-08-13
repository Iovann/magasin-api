import { Test, TestingModule } from "@nestjs/testing";
import { ProductsModule } from "./products.module";

describe("ProductsModule", () => {
  describe("with fs database type", () => {
    beforeEach(async () => {
      process.env.DB_TYPE = "fs";
    });

    afterEach(() => {
      delete process.env.DB_TYPE;
    });

    it("should be defined", async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [ProductsModule],
      }).compile();

      expect(module).toBeDefined();
    });
  });

  describe("with mongodb database type", () => {
    beforeEach(async () => {
      process.env.DB_TYPE = "mongodb";
    });

    afterEach(() => {
      delete process.env.DB_TYPE;
    });

    it("should be defined", async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [ProductsModule],
      }).compile();

      expect(module).toBeDefined();
    });
  });

  describe("with postgres database type", () => {
    beforeEach(async () => {
      process.env.DB_TYPE = "postgres";
    });

    afterEach(() => {
      delete process.env.DB_TYPE;
    });

    it("should be defined", async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [ProductsModule],
      }).compile();

      expect(module).toBeDefined();
    });
  });
});
