import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Sale, SaleStatus } from './sale.entity';
import { SaleItem } from './sale-item.entity';
import { Product, ProductStatus } from '../products/product.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { AddSaleItemDto } from './dto/add-sale-item.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
    private readonly customersService: CustomersService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    saleStatus?: string;
    userId?: number;
    customerId?: number;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const {
      page = 1,
      limit = 10,
      saleStatus,
      userId,
      customerId,
      dateFrom,
      dateTo,
    } = query;

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: 'Invalid date range.',
        errors: ['dateFrom must not be later than dateTo.'],
        timestamp: new Date().toISOString(),
      });
    }

    const qb = this.saleRepository.createQueryBuilder('sale');

    if (saleStatus) qb.andWhere('sale.saleStatus = :saleStatus', { saleStatus });
    if (userId) qb.andWhere('sale.userId = :userId', { userId });
    if (customerId) qb.andWhere('sale.customerId = :customerId', { customerId });
    if (dateFrom) qb.andWhere('sale.saleDate >= :dateFrom', { dateFrom: `${dateFrom} 00:00:00` });
    if (dateTo) qb.andWhere('sale.saleDate <= :dateTo', { dateTo: `${dateTo} 23:59:59` });

    const [data, total] = await qb
      .orderBy('sale.saleId', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, page, limit, totalItems: total };
  }

  async findOne(saleId: number): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { saleId },
      relations: ['items', 'items.product', 'customer'],
    });
    if (!sale) {
      throw new NotFoundException({
        success: false,
        statusCode: 404,
        message: 'Sale not found.',
        errors: [`No sale exists with ID ${saleId}.`],
        timestamp: new Date().toISOString(),
      });
    }
    return sale;
  }

  async create(createSaleDto: CreateSaleDto, userId: number): Promise<Sale> {
    if (createSaleDto.customerId) {
      await this.customersService.findOne(createSaleDto.customerId);
    }

    const sale = this.saleRepository.create({
      userId,
      customerId: createSaleDto.customerId ?? null,
      totalAmount: 0,
      saleStatus: SaleStatus.PENDING,
    });

    return this.saleRepository.save(sale);
  }

  async cancel(saleId: number, updateSaleDto: UpdateSaleDto): Promise<Sale> {
    return this.dataSource.transaction(async manager => {
      const sale = await this.lockSale(manager, saleId);

      if (sale.saleStatus === SaleStatus.COMPLETED) {
        throw new ConflictException({
          success: false,
          statusCode: 409,
          message: 'Sale cannot be cancelled.',
          errors: [`Sale ${saleId} is already Completed.`],
          timestamp: new Date().toISOString(),
        });
      }

      if (updateSaleDto.saleStatus !== SaleStatus.CANCELLED) {
        throw new BadRequestException('Only cancellation is allowed via this endpoint');
      }

      sale.saleStatus = SaleStatus.CANCELLED;
      return manager.save(sale);
    });
  }

  // ─── Sale Items ───────────────────────────────────────────────

  async getItems(saleId: number) {
    await this.findOne(saleId); // ensure sale exists
    const items = await this.saleItemRepository.find({
      where: { saleId },
      relations: ['product'],
    });
    return { data: items };
  }

  async addItem(saleId: number, dto: AddSaleItemDto): Promise<SaleItem> {
    return this.dataSource.transaction(async manager => {
      const sale = await this.lockSale(manager, saleId);

      if (sale.saleStatus !== SaleStatus.PENDING) {
        throw new ConflictException({
          success: false,
          statusCode: 409,
          message: 'Cannot add items.',
          errors: [`Sale ${saleId} is already ${sale.saleStatus}.`],
          timestamp: new Date().toISOString(),
        });
      }

      const product = await manager.findOne(Product, {
        where: { productId: dto.productId },
        relations: ['inventory'],
      });

      if (!product) {
        throw new NotFoundException({
          success: false,
          statusCode: 404,
          message: 'Product not found.',
          errors: [`No product exists with ID ${dto.productId}.`],
          timestamp: new Date().toISOString(),
        });
      }

      if (product.productStatus !== ProductStatus.AVAILABLE) {
        throw new ConflictException('Product is discontinued');
      }

      const inventory = product.inventory;
      const existingItems = await manager.findBy(SaleItem, { saleId, productId: dto.productId });
      const requested = existingItems.reduce((sum, item) => sum + item.quantity, dto.quantity);
      if (!inventory || inventory.quantityOnHand < requested) {
        throw new ConflictException({
          success: false,
          statusCode: 409,
          message: 'Not enough stock.',
          errors: [
            `Only ${inventory?.quantityOnHand ?? 0} unit(s) of ${product.productCode} is available.`,
          ],
          timestamp: new Date().toISOString(),
        });
      }

      const unitPrice = Number(product.unitPrice);
      const subtotal = unitPrice * dto.quantity;

      const saleItem = manager.create(SaleItem, {
        saleId,
        productId: dto.productId,
        quantity: dto.quantity,
        unitPrice,
        subtotal,
      });

      const savedItem = await manager.save(saleItem);

      // Update sale total
      sale.totalAmount = Number(sale.totalAmount) + subtotal;
      await manager.save(sale);

      return savedItem;
    });
  }

  async removeItem(saleId: number, itemId: number): Promise<void> {
    return this.dataSource.transaction(async manager => {
      const sale = await this.lockSale(manager, saleId);

      if (sale.saleStatus !== SaleStatus.PENDING) {
        throw new ConflictException({
          success: false,
          statusCode: 409,
          message: 'Item cannot be removed.',
          errors: [`Sale ${saleId} is already ${sale.saleStatus}.`],
          timestamp: new Date().toISOString(),
        });
      }

      const item = await manager.findOne(SaleItem, {
        where: { saleItemId: itemId, saleId },
      });

      if (!item) {
        throw new NotFoundException('Sale item not found');
      }

      // Subtract from total
      sale.totalAmount = Number(sale.totalAmount) - Number(item.subtotal);
      await manager.save(sale);

      await manager.remove(item);
    });
  }

  private async lockSale(manager: EntityManager, saleId: number) {
    const sale = await manager.findOne(Sale, {
      where: { saleId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!sale) throw new NotFoundException('Sale not found.');
    return sale;
  }
}
