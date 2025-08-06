import { User } from '../entities/user.entity';

export abstract class IUserRepository {
  // Note: on ne passe pas le DTO directement pour la création
  // car le service devra d'abord hasher le mot de passe.
  abstract create(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findAll(): Promise<User[]>;
  abstract delete(id: string): Promise<void>;
}
