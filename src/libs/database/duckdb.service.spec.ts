import { Test, TestingModule } from '@nestjs/testing';
import { DuckDBService } from './duckdb.service';
import { join } from 'path';

// Mock de @duckdb/node-api - Simplifié pour éviter les problèmes de hoisting
jest.mock('@duckdb/node-api', () => {
  const mockConnection = {
    run: jest.fn().mockResolvedValue(undefined),
    closeSync: jest.fn(),
  };

  const mockInstance = {
    connect: jest.fn().mockResolvedValue(mockConnection),
    closeSync: jest.fn(),
  };

  return {
    DuckDBInstance: {
      create: jest.fn().mockResolvedValue(mockInstance),
    },
    // Supprime DuckDBConnection du mock pour éviter l'erreur de référence
  };
});

// Mock de path.join
jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('/test/path/to/db.duckdb'),
}));

describe('DuckDBService', () => {
  let service: DuckDBService;
  let mockDuckDB: any;

  beforeEach(async () => {
    //eslint-disable-next-line
    const { DuckDBInstance } = require('@duckdb/node-api');
    mockDuckDB = { DuckDBInstance };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DuckDBService],
    }).compile();

    service = module.get<DuckDBService>(DuckDBService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialize', () => {
    it('should initialize DuckDB with correct parameters', async () => {
      await (service as any).initialize();

      expect(join).toHaveBeenCalledWith(process.cwd(), 'data', 'app.duckdb');
      expect(mockDuckDB.DuckDBInstance.create).toHaveBeenCalledWith('/test/path/to/db.duckdb');
      
      // Récupérer l'instance mockée pour vérifier les appels
      const mockInstanceCall = mockDuckDB.DuckDBInstance.create.mock.results[0].value;
      const instancePromise = await mockInstanceCall;
      
      expect(instancePromise.connect).toHaveBeenCalled();
      
      // Récupérer la connexion mockée pour vérifier les PRAGMAs
      const mockConnectionCall = instancePromise.connect.mock.results[0].value;
      const connection = await mockConnectionCall;
      
      expect(connection.run).toHaveBeenCalledWith("PRAGMA threads=4");
      expect(connection.run).toHaveBeenCalledWith("PRAGMA memory_limit='2GB'");
      expect(connection.run).toHaveBeenCalledWith("PRAGMA enable_profiling='json'");
    });

    it('should not initialize twice if already initialized', async () => {
      // Premier appel
      await (service as any).initialize();
      
      // Compter les appels avant le reset
      const callCount = mockDuckDB.DuckDBInstance.create.mock.calls.length;
      
      // Deuxième appel
      await (service as any).initialize();
      
      // Vérifie que create n'est pas appelé une deuxième fois
      expect(mockDuckDB.DuckDBInstance.create.mock.calls.length).toBe(callCount);
    });
  });

  describe('getConnection', () => {
    it('should return a connection', async () => {
      const connection = await service.getConnection();
      
      expect(connection).toBeDefined();
      expect(mockDuckDB.DuckDBInstance.create).toHaveBeenCalled();
    });

    it('should use existing connection if available', async () => {
      // Premier appel
      await service.getConnection();
      
      // Compter les appels de connect
      const mockInstanceCall = mockDuckDB.DuckDBInstance.create.mock.results[0].value;
      const instance = await mockInstanceCall;
      const connectCallCount = instance.connect.mock.calls.length;
      
      // Deuxième appel
      await service.getConnection();
      
      // Vérifie que connect n'est pas appelé une deuxième fois
      expect(instance.connect.mock.calls.length).toBe(connectCallCount);
    });
  });

  describe('onModuleDestroy', () => {
    it('should close connection and instance', async () => {
      // Initialise le service pour avoir une connexion
      await service.getConnection();
      
      // Récupérer les mocks pour vérifier les appels
      const mockInstanceCall = mockDuckDB.DuckDBInstance.create.mock.results[0].value;
      const instance = await mockInstanceCall;
      const mockConnectionCall = instance.connect.mock.results[0].value;
      const connection = await mockConnectionCall;
      
      // Appelle onModuleDestroy
      await service.onModuleDestroy();
      
      expect(connection.closeSync).toHaveBeenCalled();
      expect(instance.closeSync).toHaveBeenCalled();
    });

    it('should not throw if connection is not initialized', async () => {
      // Appelle onModuleDestroy sans initialisation
      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });

});