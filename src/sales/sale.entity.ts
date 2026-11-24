import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Customer } from '../customers/customer.entity';
import { SaleItem } from './sale-item.entity';
import { Payment } from '../payments/payment.entity';
import { Receipt } from '../receipts/receipt.entity';

export enum SaleStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn({ name: 'sale_id' })
  saleId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (user) => user.sales, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'customer_id', nullable: true })
  customerId: number | null;

  @ManyToOne(() => Customer, (customer) => customer.sales, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;

  @CreateDateColumn({ name: 'sale_date' })
  saleDate: Date;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column({
    name: 'sale_status',
    type: 'varchar',
    length: 12,
    default: SaleStatus.PENDING,
  })
  saleStatus: SaleStatus;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.sale, { cascade: true })
  items: SaleItem[];

  @OneToMany(() => Payment, (payment) => payment.sale)
  payments: Payment[];

  @OneToOne(() => Receipt, (receipt) => receipt.sale)
  receipt: Receipt;
}
