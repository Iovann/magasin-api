import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "./app.module";
import { TestCacheModule } from "../test/test-cache.config";

describe("AppModule", () => {
  it("should be defined", async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestCacheModule],
    }).compile();

    expect(module).toBeDefined();
  });
});
