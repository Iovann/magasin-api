import { User } from '../entities/user.entity';

export abstract class IUserRepository {
  abstract create(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findAll(): Promise<User[]>;
  abstract delete(id: string): Promise<void>;
}
