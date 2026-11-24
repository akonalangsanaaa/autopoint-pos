import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Sale } from '../sales/sale.entity';

@Entity('receipts')
export class Receipt {
  @PrimaryGeneratedColumn({ name: 'receipt_id' })
  receiptId: number;

  @Column({ name: 'sale_id', unique: true })
  saleId: number;

  @OneToOne(() => Sale, (sale) => sale.receipt, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column({ name: 'receipt_number', type: 'varchar', length: 20, unique: true })
  receiptNumber: string;

  @CreateDateColumn({ name: 'date_issued' })
  dateIssued: Date;

  @Column({ name: 'file_path', type: 'varchar', length: 255, nullable: true })
  filePath: string | null;
}
