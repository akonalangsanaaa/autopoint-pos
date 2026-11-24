import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Category } from '../categories/category.entity';
import { Inventory } from '../inventory/inventory.entity';
import { SaleItem } from '../sales/sale-item.entity';

export enum ProductStatus {
  AVAILABLE = 'Available',
  DISCONTINUED = 'Discontinued',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn({ name: 'product_id' })
  productId: number;

  @Column({ name: 'category_id' })
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'product_code', type: 'varchar', length: 20, unique: true })
  productCode: string;

  @Column({ name: 'product_name', type: 'varchar', length: 100 })
  productName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  brand: string | null;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  unitPrice: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description: string | null;

  @Column({
    name: 'product_status',
    type: 'varchar',
    length: 12,
    default: ProductStatus.AVAILABLE,
  })
  productStatus: ProductStatus;

  @OneToOne(() => Inventory, (inventory) => inventory.product)
  inventory: Inventory;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.product)
  saleItems: SaleItem[];
}
