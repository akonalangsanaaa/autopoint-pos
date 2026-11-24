import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sale } from '../sales/sale.entity';

export enum PaymentMethod {
  CASH = 'Cash',
  CARD = 'Card',
}

export enum PaymentStatus {
  APPROVED = 'Approved',
  DECLINED = 'Declined',
  PENDING = 'Pending',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn({ name: 'payment_id' })
  paymentId: number;

  @Column({ name: 'sale_id' })
  saleId: number;

  @ManyToOne(() => Sale, (sale) => sale.payments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 10,
  })
  paymentMethod: PaymentMethod;

  @Column({
    name: 'amount_paid',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  amountPaid: number;

  @Column({
    name: 'change_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  changeAmount: number;

  @Column({ name: 'reference_no', type: 'varchar', length: 50, nullable: true })
  referenceNo: string | null;

  @Column({
    name: 'payment_status',
    type: 'varchar',
    length: 10,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @CreateDateColumn({ name: 'payment_date' })
  paymentDate: Date;
}
