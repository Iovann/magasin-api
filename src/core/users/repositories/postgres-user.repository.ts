import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { IUserRepository, TransactionalSession } from "./user.repository";
import { PostgresUser } from "../entities/postgres-user.entity";
import { User } from "../entities/user.entity";

@Injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(PostgresUser)
    private readonly userRepository: Repository<PostgresUser>,
  ) {}

  private getRepository(session?: TransactionalSession): Repository<PostgresUser> {
    return session
      ? (session as EntityManager).getRepository(PostgresUser)
      : this.userRepository;
  }

  async create(
    user: Omit<User, "id" | "createdAt">,
    session?: TransactionalSession,
  ): Promise<User> {
    const repo = this.getRepository(session);
    const newUser = repo.create(user);
    return repo.save(newUser);
  }

  async findById(
    id: string,
    session?: TransactionalSession,
  ): Promise<User | null> {
    const repo = this.getRepository(session);
    return repo.findOneBy({ id });
  }

  async findByEmail(
    email: string,
    session?: TransactionalSession,
  ): Promise<User | null> {
    const repo = this.getRepository(session);
    return repo.findOneBy({ email });
  }

  async findAll(session?: TransactionalSession): Promise<User[]> {
    const repo = this.getRepository(session);
    return repo.find();
  }

  async delete(id: string, session?: TransactionalSession): Promise<void> {
    const repo = this.getRepository(session);
    await repo.delete(id);
  }
}
