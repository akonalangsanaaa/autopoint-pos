import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Sale } from '../sales/sale.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn({ name: 'customer_id' })
  customerId: number;

  @Column({ name: 'first_name', type: 'varchar', length: 50 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 50 })
  lastName: string;

  @Column({ name: 'contact_number', type: 'varchar', length: 15, nullable: true })
  contactNumber: string | null;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  address: string | null;

  @OneToMany(() => Sale, (sale) => sale.customer)
  sales: Sale[];
}
