import { Test, TestingModule } from "@nestjs/testing";
import { ErrorHandlingModule } from "./error-handling.module";
import { ErrorHandlingService } from "./error-handling";
import { WinstonModule } from "nest-winston";
import * as winston from "winston";

describe("ErrorHandlingModule", () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        WinstonModule.forRoot({
          transports: [
            new winston.transports.Console({
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.ms(),
                winston.format.json(),
              ),
            }),
          ],
        }),
        ErrorHandlingModule,
      ],
    }).compile();
  });

  it("should be defined", () => {
    expect(module).toBeDefined();
  });

  it("should have ErrorHandlingService defined", () => {
    const service = module.get<ErrorHandlingService>(ErrorHandlingService);
    expect(service).toBeDefined();
  });

  it("should have WinstonModule configured", () => {
    const winstonModule = module.get(WinstonModule);
    expect(winstonModule).toBeDefined();
  });

  it("should export ErrorHandlingService", () => {
    const service = module.get<ErrorHandlingService>(ErrorHandlingService);
    expect(service).toBeInstanceOf(ErrorHandlingService);
  });
});
