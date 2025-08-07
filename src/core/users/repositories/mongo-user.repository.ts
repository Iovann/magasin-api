import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUserRepository } from './user.repository';
import { MongoUser } from '../entities/mongo-user.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class MongoUserRepository implements IUserRepository {
  constructor(
    @InjectModel(MongoUser.name)
    private readonly userModel: Model<MongoUser>,
  ) {}

  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    console.log('🍃 MongoUserRepository.create called with:', JSON.stringify(user, null, 2));
    console.log('🍃 User data keys:', Object.keys(user));
    console.log('🍃 Email value:', user.email);
    
    const newUser = new this.userModel(user);
    console.log('🍃 Created Mongoose document:', JSON.stringify(newUser.toObject(), null, 2));
    
    const savedUser = await newUser.save();
    return this.toUserEntity(savedUser);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.userModel.findById(id).exec();
    return user ? this.toUserEntity(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email }).exec();
    return user ? this.toUserEntity(user) : null;
  }

  async findAll(): Promise<User[]> {
    const users = await this.userModel.find().exec();
    return users.map(user => this.toUserEntity(user));
  }

  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }

  // Méthode spéciale pour l'authentification - inclut le passwordHash
  async findByEmailWithPassword(email: string): Promise<(User & { passwordHash: string }) | null> {
    const user = await this.userModel.findOne({ email }).select('+passwordHash').exec();
    if (!user || !user.passwordHash) return null;
    
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      passwordHash: user.passwordHash,
    };
  }

  // Méthode privée pour transformer un document Mongoose en entité User (sans passwordHash)
  private toUserEntity(mongoUser: MongoUser): User {
    return {
      id: mongoUser.id,
      email: mongoUser.email,
      role: mongoUser.role,
      createdAt: mongoUser.createdAt,
      // passwordHash est intentionnellement omis pour la sécurité
    };
  }
}
