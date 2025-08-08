import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Role } from "../../../common/enum/role.enum";

@Entity("users")
export class PostgresUser implements User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({
    type: "enum",
    enum: Role,
    default: Role.Magasinier,
  })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;
}
