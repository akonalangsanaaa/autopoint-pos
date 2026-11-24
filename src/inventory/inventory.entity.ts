import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../products/product.entity';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn({ name: 'inventory_id' })
  inventoryId: number;

  @Column({ name: 'product_id', unique: true })
  productId: number;

  @OneToOne(() => Product, (product) => product.inventory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({
    name: 'quantity_on_hand',
    type: 'int',
    default: 0,
  })
  quantityOnHand: number;

  @Column({
    name: 'reorder_level',
    type: 'int',
    default: 5,
  })
  reorderLevel: number;

  @UpdateDateColumn({ name: 'last_updated' })
  lastUpdated: Date;
}
