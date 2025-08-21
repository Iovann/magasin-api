import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { DuckDBInstance, DuckDBConnection } from "@duckdb/node-api";
import { join } from "path";

@Injectable()
export class DuckDBService implements OnModuleDestroy {
  private instance: DuckDBInstance;
  private connection: DuckDBConnection;
  private isInitialized = false;
  private initializationPromise: Promise<void>;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        const dbPath = join(process.cwd(), "data", "app.duckdb");

        // Création de l'instance
        this.instance = await DuckDBInstance.create(dbPath);
        this.connection = await this.instance.connect();

        // Configuration des performances
        await this.connection.run("PRAGMA threads=4");
        await this.connection.run("PRAGMA memory_limit='2GB'");
        await this.connection.run("PRAGMA enable_profiling='json'");

        this.isInitialized = true;
        console.log("DuckDB connection initialized");
      } catch (error) {
        console.error("Failed to initialize DuckDB:", error);
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  async getConnection(): Promise<DuckDBConnection> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.connection;
  }

  async onModuleDestroy() {
    if (this.connection) {
      this.connection.closeSync();
    }
    if (this.instance) {
      this.instance.closeSync();
    }
  }
}
