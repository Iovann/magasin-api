import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Product } from "./product.entity";

/**
 * Represents a Product entity for PostgreSQL.
 */
@Entity("products")
export class PostgresProduct implements Product {
  /**
   * The unique identifier of the product (UUID).
   */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * The name of the product.
   */
  @Column()
  name: string;

  /**
   * The model name of the product.
   */
  @Column()
  modelName: string;

  /**
   * The quantity in stock.
   */
  @Column({ type: "int" })
  quantity: number;

  /**
   * The price of the product.
   */
  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  /**
   * The creation date of the product.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * The last update date of the product.
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
