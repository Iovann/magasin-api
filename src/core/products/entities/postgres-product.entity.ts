import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('products')
export class PostgresProduct extends Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  model: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ default: false })
  isSold: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
