import { Test, TestingModule } from "@nestjs/testing";
import { EncryptionService } from "./encryption.service";
import { ConfigService } from "@nestjs/config";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";

describe("EncryptionService", () => {
  let service: EncryptionService;

  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              if (key === "CRYPTO_SECRET") return "mocked-secret";
              if (key === "CRYPTO_IV") return "mocked-iv";
              return "mocked-value";
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => {
    module.close();
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
