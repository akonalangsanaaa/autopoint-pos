import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Product } from '../products/product.entity';

export enum ProductType {
  PART = 'Part',
  ACCESSORY = 'Accessory',
  VEHICLE = 'Vehicle',
}

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn({ name: 'category_id' })
  categoryId: number;

  @Column({ name: 'category_name', type: 'varchar', length: 50, unique: true })
  categoryName: string;

  @Column({
    name: 'product_type',
    type: 'varchar',
    length: 15,
  })
  productType: ProductType;

  @Column({ type: 'varchar', length: 150, nullable: true })
  description: string | null;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
