import { Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { IUserRepository } from './user.repository';
import { User } from '../entities/user.entity';
import { DatabaseConfig } from '../../../config/database.config';

@Injectable()
export class FsUserRepository implements IUserRepository, OnModuleInit {
  private dbPath: string;
  private data: User[] = [];

  constructor(private readonly dbConfig: DatabaseConfig) {
    this.dbPath = path.resolve(this.dbConfig.dbPath, 'users.json');
  }

  async onModuleInit() {
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      const fileContent = await fs.readFile(this.dbPath, 'utf-8');
      this.data = JSON.parse(fileContent);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.data = [];
        await this.persist();
      } else {
        throw error;
      }
    }
  }

  private async persist(): Promise<void> {
    await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
  }

  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const newUser: User = {
      id: randomUUID(),
      ...user,
      createdAt: new Date(),
    };
    this.data.push(newUser);
    await this.persist();
    return newUser;
  }

  async findById(id: string): Promise<User | null> {
    return this.data.find(u => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.data.find(u => u.email === email) || null;
  }

  async findAll(): Promise<User[]> {
    return [...this.data];
  }

  async delete(id: string): Promise<void> {
    const initialLength = this.data.length;
    this.data = this.data.filter(u => u.id !== id);
    if (this.data.length < initialLength) {
      await this.persist();
    }
  }
}
