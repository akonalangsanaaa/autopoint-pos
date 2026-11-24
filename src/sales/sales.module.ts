import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './sale.entity';
import { SaleItem } from './sale-item.entity';
import { Product } from '../products/product.entity';
import { Inventory } from '../inventory/inventory.entity';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, Product, Inventory]),
    CustomersModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
