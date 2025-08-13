import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseModule } from "./database.module";

describe("DatabaseModule", () => {
  describe("with postgres database type", () => {
    beforeEach(async () => {
      process.env.DB_TYPE = "postgres";
    });

    afterEach(() => {
      delete process.env.DB_TYPE;
    });

    it("should be defined", async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [DatabaseModule],
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
        imports: [DatabaseModule],
      }).compile();

      expect(module).toBeDefined();
    });
  });

  describe("with fs database type", () => {
    beforeEach(async () => {
      process.env.DB_TYPE = "fs";
    });

    afterEach(() => {
      delete process.env.DB_TYPE;
    });

    it("should be defined", async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [DatabaseModule],
      }).compile();

      expect(module).toBeDefined();
    });
  });
});
