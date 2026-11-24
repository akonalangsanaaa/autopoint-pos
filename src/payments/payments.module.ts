import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { Sale } from '../sales/sale.entity';
import { SaleItem } from '../sales/sale-item.entity';
import { Inventory } from '../inventory/inventory.entity';
import { Receipt } from '../receipts/receipt.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Sale, SaleItem, Inventory, Receipt]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
