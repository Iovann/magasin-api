import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IUserRepository } from "./user.repository";
import { PostgresUser } from "../entities/postgres-user.entity";
import { User } from "../entities/user.entity";

@Injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(PostgresUser)
    private readonly userRepository: Repository<PostgresUser>,
  ) {}

  async create(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
