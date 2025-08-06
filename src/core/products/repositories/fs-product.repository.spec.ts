import { Test, TestingModule } from '@nestjs/testing';
import { FsProductRepository } from './fs-product.repository';
import { DatabaseConfig } from '../../../config/database.config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { CreateProductDto } from '../dto/create-product.dto';

// On "mock" (simule) le module 'fs' en entier.
// Chaque fois que le code importera 'fs', il obtiendra notre version simulée.
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue('[]'), // Par défaut, on simule un fichier vide
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

// On "mock" aussi le module 'crypto' pour contrôler les IDs générés
jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('mocked-uuid-123'),
}));

describe('FsProductRepository', () => {
  let repository: FsProductRepository;
  let mockDbConfig: DatabaseConfig;

  // Avant chaque test, on reconfigure notre module de test
  beforeEach(async () => {
    // On crée une fausse configuration pour les tests
    mockDbConfig = {
      dbPath: './test-data',
    } as DatabaseConfig;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FsProductRepository,
        // On fournit notre fausse configuration
        {
          provide: DatabaseConfig,
          useValue: mockDbConfig,
        },
      ],
    }).compile();

    repository = module.get<FsProductRepository>(FsProductRepository);

    // On s'assure que le repository est bien initialisé (appelle onModuleInit)
    await repository.onModuleInit();

    // On nettoie les mocks entre chaque test pour éviter les interférences
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product, add it to the data array, and persist', async () => {
      const createDto: CreateProductDto = {
        name: 'Water Gun 5000',
        modelName: 'WG5K',
        quantity: 10,
      };

      const result = await repository.create(createDto);

      // 1. Vérifier que le produit retourné est correct
      expect(result.id).toBe('mocked-uuid-123');
      expect(result.name).toBe(createDto.name);

      // 2. Vérifier que la méthode d'écriture a été appelée
      expect(fs.writeFile).toHaveBeenCalledTimes(1);

      // 3. Vérifier que les données écrites sont correctes
      const expectedDataToWrite = JSON.stringify([result], null, 2);
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.resolve(mockDbConfig.dbPath, 'products.json'),
        expectedDataToWrite,
      );
    });
  });

  describe('findAll', () => {
    it('should return all products from the data file', async () => {
      // On simule un fichier contenant deux produits
      const mockData = [
        { id: '1', name: 'Product 1', modelName: 'A', quantity: 1, createdAt: new Date() },
        { id: '2', name: 'Product 2', modelName: 'B', quantity: 2, createdAt: new Date() },
      ];
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      // On réinitialise le repository pour qu'il charge les nouvelles données
      await repository.onModuleInit();

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Product 1');
    });
  });

  describe('findById', () => {
    it('should return a product if found', async () => {
        const mockData = [{ id: 'abc', name: 'Found Me', modelName: 'A', quantity: 1, createdAt: new Date() }];
        (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
        await repository.onModuleInit();

        const result = await repository.findById('abc');
        expect(result).toBeDefined();
        expect(result?.name).toBe('Found Me');
    });

    it('should return null if not found', async () => {
        const result = await repository.findById('non-existent-id');
        expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should remove a product and persist the changes', async () => {
        const mockData = [{ id: 'to-delete', name: 'Delete Me', modelName: 'A', quantity: 1, createdAt: new Date() }];
        (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
        await repository.onModuleInit();

        await repository.delete('to-delete');

        // Vérifier que l'écriture a été appelée avec un tableau vide
        expect(fs.writeFile).toHaveBeenCalledWith(
            expect.any(String),
            JSON.stringify([], null, 2)
        );
    });
  });
});
