import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Sale } from '../sales/sale.entity';

export enum UserRole {
  CASHIER = 'Cashier',
  ADMIN = 'Admin',
}

export enum AccountStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('user_accounts')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Column({ name: 'first_name', type: 'varchar', length: 50 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 50 })
  lastName: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  username: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({
    type: 'varchar',
    length: 15,
    default: UserRole.CASHIER,
  })
  role: UserRole;

  @Column({
    name: 'account_status',
    type: 'varchar',
    length: 10,
    default: AccountStatus.ACTIVE,
  })
  accountStatus: AccountStatus;

  @CreateDateColumn({ name: 'date_created' })
  dateCreated: Date;

  @OneToMany(() => Sale, (sale) => sale.user)
  sales: Sale[];
}
