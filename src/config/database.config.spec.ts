import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DatabaseConfig } from './database.config';

describe('DatabaseConfig', () => {
  describe('Validation de base', () => {
    it('devrait être défini', () => {
      const config = new DatabaseConfig();
      expect(config).toBeDefined();
    });

    it('devrait avoir une valeur par défaut pour dbPath', () => {
      const config = new DatabaseConfig();
      expect(config.dbPath).toBe('./data');
    });
  });

  describe('Validation des champs obligatoires', () => {
    it('devrait valider nodeEnv', async () => {
      const config = plainToInstance(DatabaseConfig, {});
      const errors = await validate(config);
      expect(errors.some(e => e.property === 'nodeEnv')).toBeTruthy();
    });

    it('devrait valider dbType', async () => {
      const config = plainToInstance(DatabaseConfig, { nodeEnv: 'test' });
      const errors = await validate(config);
      expect(errors.some(e => e.property === 'dbType')).toBeTruthy();
    });
  });

  describe('Validation des types', () => {
    it('devrait accepter un type de base de données valide', async () => {
      const config = plainToInstance(DatabaseConfig, {
        nodeEnv: 'test',
        dbType: 'postgres'
      });
      const errors = await validate(config);
      expect(errors.some(e => e.property === 'dbType')).toBeFalsy();
    });

    it('devrait rejeter un type de base de données invalide', async () => {
      const config = plainToInstance(DatabaseConfig, {
        nodeEnv: 'test',
        dbType: 'oracle'
      });
      const errors = await validate(config);
      expect(errors.some(e => 
        e.property === 'dbType' && 
        e.constraints?.isIn
      )).toBeTruthy();
    });
  });

  describe('Configuration pour base de données distante', () => {
    it('devrait valider une configuration complète', async () => {
      const config = plainToInstance(
        DatabaseConfig,
        {
          nodeEnv: 'test',
          dbType: 'postgres',
          dbHost: 'localhost',
          dbPort: '5432',
          dbName: 'testdb',
          dbUser: 'user',
          dbPassword: 'password',
          dbSync: 'true'
        },
        { enableImplicitConversion: true }
      );
      
      const errors = await validate(config);
      expect(errors.length).toBe(0);
      expect(config.dbPort).toBe(5432);
      expect(config.dbSync).toBe(true);
    });

    it('devrait valider le format du port', async () => {
      const config = plainToInstance(
        DatabaseConfig,
        {
          nodeEnv: 'test',
          dbType: 'postgres',
          dbPort: '123456'
        },
        { enableImplicitConversion: true }
      );
      
      const errors = await validate(config);
      const portError = errors.find(e => e.property === 'dbPort');
      expect(portError?.constraints?.max).toBeDefined();
    });
  });

  describe('Configuration pour stockage fichier', () => {
    const validTxtConfig = {
      nodeEnv: 'test',
      dbType: 'txt',
      dbPath: './custom-data',
      dbSync: 'true'
    };

    it('devrait accepter une configuration minimale', async () => {
      const config = plainToInstance(
        DatabaseConfig, 
        validTxtConfig,
        { enableImplicitConversion: true }
      );
      
      const errors = await validate(config);
      expect(errors.length).toBe(0);
      expect(config.dbPath).toBe('./custom-data');
      expect(config.dbSync).toBe(true);
    });

    it('devrait utiliser le chemin par défaut si non spécifié', async () => {
        const config = plainToInstance(
          DatabaseConfig, 
          {
            nodeEnv: 'test',
            dbType: 'txt',
            dbSync: 'true'
          },
          { enableImplicitConversion: true }
        );
        
        const errors = await validate(config);
        expect(errors.length).toBe(0);
        expect(config.dbPath).toBe('./data');
      });
  });

  describe('Transformation des types', () => {
    it('devrait convertir les booléens', async () => {
      const config = plainToInstance(
        DatabaseConfig,
        {
          nodeEnv: 'test',
          dbType: 'txt',
          dbSync: '1'
        },
        { enableImplicitConversion: true }
      );
      
      const errors = await validate(config);
      expect(errors.length).toBe(0);
      expect(config.dbSync).toBe(true);
    });

    it('devrait convertir les nombres', async () => {
      const config = plainToInstance(
        DatabaseConfig,
        {
            nodeEnv: 'test',
            dbType: 'postgres',
            dbHost: 'localhost',
            dbPort: '5432',
            dbName: 'testdb',
            dbUser: 'user',
            dbPassword: 'password',
            dbSync: 'true'
          },
        { enableImplicitConversion: true }
      );
      
      const errors = await validate(config);
      expect(errors.length).toBe(0);
      expect(config.dbPort).toBe(5432);
    });
  });
});