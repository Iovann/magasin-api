import { Test, TestingModule } from "@nestjs/testing";
import { getQueueToken } from "@nestjs/bullmq";
import { CacheModule } from "../../libs/cache/cache.module";
import { UsersService } from "./services/users.service";
import { IUserRepository } from "./repositories/user.repository";
import { ErrorHandlingService } from "../../common/response/error-handling";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";

describe("UsersModule", () => {
  let module: TestingModule;

  const mockUserRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockErrorHandlingService = {
    returnErrorOnConflict: jest.fn(),
    returnErrorOnInternalServerError: jest.fn(),
    returnErrorOnNotFound: jest.fn(),
  };

  const setup = async (dbType: string) => {
    process.env.DB_TYPE = dbType;
    module = await Test.createTestingModule({
      imports: [CacheModule],
      providers: [
        UsersService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: IUserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: ErrorHandlingService,
          useValue: mockErrorHandlingService,
        },
        {
          provide: getQueueToken('email'),
          useValue: { add: jest.fn() },
        },
      ],
    }).compile();
  };

  afterEach(() => {
    delete process.env.DB_TYPE;
  });

  describe("with fs database type", () => {
    beforeEach(async () => {
      await setup("fs");
    });

    it("should be defined", () => {
      expect(module).toBeDefined();
    });

    it("should resolve UsersService", () => {
      expect(module.get<UsersService>(UsersService)).toBeInstanceOf(UsersService);
    });
  });

  describe("with mongodb database type", () => {
    beforeEach(async () => {
      await setup("mongodb");
    });

    it("should be defined", () => {
      expect(module).toBeDefined();
    });

    it("should resolve UsersService", () => {
      expect(module.get<UsersService>(UsersService)).toBeInstanceOf(UsersService);
    });
  });

  describe("with postgres database type", () => {
    beforeEach(async () => {
      await setup("postgres");
    });

    it("should be defined", () => {
      expect(module).toBeDefined();
    });

    it("should resolve UsersService", () => {
      expect(module.get<UsersService>(UsersService)).toBeInstanceOf(UsersService);
    });
  });
});