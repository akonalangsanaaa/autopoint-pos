import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Inventory } from '../inventory/inventory.entity';
import { Receipt } from '../receipts/receipt.entity';
import { Sale, SaleStatus } from '../sales/sale.entity';
import { SaleItem } from '../sales/sale-item.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment, PaymentMethod, PaymentStatus } from './payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly dataSource: DataSource,
  ) {}

  async findOne(paymentId: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOneBy({ paymentId });
    if (!payment) throw new NotFoundException('Payment not found.');
    return payment;
  }

  async create(dto: CreatePaymentDto): Promise<Payment> {
    return this.dataSource.transaction(async manager => {
      const sale = await manager.findOne(Sale, {
        where: { saleId: dto.saleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!sale) throw new NotFoundException('Sale not found.');
      if (sale.saleStatus !== SaleStatus.PENDING) {
        throw new ConflictException('Only pending sales can be paid.');
      }

      const items = await manager.findBy(SaleItem, { saleId: sale.saleId });
      if (!items.length) throw new BadRequestException('Cannot pay an empty sale.');

      const totalCents = Math.round(Number(sale.totalAmount) * 100);
      const paidCents = Math.round(dto.amountPaid * 100);
      const cash = dto.paymentMethod === PaymentMethod.CASH;
      if (cash && paidCents < totalCents) {
        throw new BadRequestException('Amount received is less than the sale total.');
      }
      if (!cash && (paidCents !== totalCents || !dto.referenceNo?.trim())) {
        throw new BadRequestException('Card payments require the exact total and a terminal reference.');
      }

      const quantities = new Map<number, number>();
      for (const item of items) {
        quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
      }
      for (const [productId, quantity] of [...quantities].sort(([left], [right]) => left - right)) {
        const inventory = await manager.findOne(Inventory, {
          where: { productId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!inventory || inventory.quantityOnHand < quantity) {
          throw new ConflictException('Insufficient stock for product ' + productId + '.');
        }
        inventory.quantityOnHand -= quantity;
        await manager.save(inventory);
      }

      const payment = await manager.save(manager.create(Payment, {
        saleId: sale.saleId,
        paymentMethod: dto.paymentMethod,
        amountPaid: dto.amountPaid,
        changeAmount: cash ? (paidCents - totalCents) / 100 : 0,
        referenceNo: dto.referenceNo?.trim() || null,
        paymentStatus: PaymentStatus.APPROVED,
      }));

      sale.saleStatus = SaleStatus.COMPLETED;
      await manager.save(sale);
      const receiptNumber = 'OR-' + new Date().getFullYear() + '-' + String(sale.saleId).padStart(6, '0');
      await manager.save(manager.create(Receipt, {
        saleId: sale.saleId,
        receiptNumber,
        filePath: null,
      }));
      return payment;
    });
  }
}
