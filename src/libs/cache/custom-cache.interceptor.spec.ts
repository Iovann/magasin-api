import { Test, TestingModule } from "@nestjs/testing";
import { CustomCacheInterceptor } from "./custom-cache.interceptor";
import { CacheService } from "./cache.service";
import { Reflector } from "@nestjs/core";
import { of } from "rxjs";

describe("CustomCacheInterceptor", () => {
  let interceptor: CustomCacheInterceptor;
  let cacheService: jest.Mocked<CacheService>;

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue(undefined),
    ["logger"]: {
      error: jest.fn(),
    },
  };

  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        CustomCacheInterceptor,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        Reflector,
      ],
    }).compile();

    interceptor = module.get<CustomCacheInterceptor>(CustomCacheInterceptor);
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    module.close();
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(interceptor).toBeDefined();
  });

  describe("intercept", () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: "GET",
          url: "/test",
        }),
      }),
    } as any;

    const next = {
      handle: () => of("live data"),
    };

    it("should return cached value if it exists", (done) => {
      cacheService.get.mockResolvedValue("cached data");
      interceptor.intercept(context, next).then((result) => {
        result.subscribe((data) => {
          expect(data).toBe("cached data");
          expect(cacheService.get).toHaveBeenCalledWith("cache:GET:/test");
          done();
        });
      });
    });

    // it('should cache the response if not cached', (done) => {
    //     cacheService.get.mockResolvedValue(undefined);
    //     interceptor.intercept(context, next).then(result => {
    //         result.pipe(
    //             tap(data => {
    //                 expect(data).toBe('live data');
    //                 expect(cacheService.set).toHaveBeenCalledWith('cache:GET:/test', 'live data', { ttl: 3600 });
    //                 done();
    //             })
    //         ).subscribe();
    //     });
    // });

    it("should handle cache get error", (done) => {
      cacheService.get.mockRejectedValue(new Error("Cache error"));
      interceptor.intercept(context, next).then((result) => {
        result.subscribe((data) => {
          expect(data).toBe("live data");
          expect(cacheService.set).not.toHaveBeenCalled();
          done();
        });
      });
    });
  });
});
