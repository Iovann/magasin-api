import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../repositories/user.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Créer un nouvel utilisateur
   * Seul le SuperAdmin peut créer des utilisateurs
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Vérifier si l'email existe déjà
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException(
        `Un utilisateur avec l'email ${createUserDto.email} existe déjà`
      );
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    // Créer l'utilisateur
    const userData = {
      email: createUserDto.email,
      passwordHash,
      role: createUserDto.role,
    };

    return this.userRepository.create(userData);
  }

  /**
   * Obtenir tous les utilisateurs
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  /**
   * Trouver un utilisateur par ID
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }
    return user;
  }

  /**
   * Trouver un utilisateur par email (pour l'authentification future)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Supprimer un utilisateur
   * Seul le SuperAdmin peut supprimer
   */
  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    await this.userRepository.delete(id);
  }

  /**
   * Compter le nombre d'utilisateurs par rôle
   */
  async getUserStats(): Promise<{ total: number; byRole: Record<string, number> }> {
    const users = await this.userRepository.findAll();
    const stats = {
      total: users.length,
      byRole: {} as Record<string, number>,
    };

    users.forEach(user => {
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
    });

    return stats;
  }
}
