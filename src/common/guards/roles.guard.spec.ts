import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { Role } from "../enum/role.enum";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;

  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: Role.Vendeur },
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  });

  afterEach(() => {
    module.close();
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should allow access when no roles are required", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      mockExecutionContext.getHandler(),
      mockExecutionContext.getClass(),
    ]);
  });

  it("should allow access when user has required role", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.Vendeur]);

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      mockExecutionContext.getHandler(),
      mockExecutionContext.getClass(),
    ]);
  });

  it("should deny access when user does not have required role", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue([Role.SuperAdmin]);

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(false);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      mockExecutionContext.getHandler(),
      mockExecutionContext.getClass(),
    ]);
  });

  it("should allow access when user has one of multiple required roles", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue([Role.SuperAdmin, Role.Vendeur]);

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      mockExecutionContext.getHandler(),
      mockExecutionContext.getClass(),
    ]);
  });

  it("should deny access when user has none of the required roles", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue([Role.SuperAdmin, Role.Magasinier]);

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(false);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      mockExecutionContext.getHandler(),
      mockExecutionContext.getClass(),
    ]);
  });

  it("should deny access when user is undefined", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.Vendeur]);

    mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: undefined,
      }),
    });

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(false);
  });

  it("should deny access when user has no role", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.Vendeur]);

    mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: {},
      }),
    });

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(false);
  });
});
