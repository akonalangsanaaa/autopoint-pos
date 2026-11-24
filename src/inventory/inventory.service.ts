import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './inventory.entity';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    lowStock?: boolean | string;
    productId?: number;
  }) {
    const { page = 1, limit = 10, lowStock, productId } = query;

    if (lowStock !== undefined && lowStock !== 'true' && lowStock !== 'false' && typeof lowStock !== 'boolean') {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: 'Invalid query parameter.',
        errors: ['lowStock must be true or false.'],
        timestamp: new Date().toISOString(),
      });
    }

    const qb = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product');

    if (productId) {
      qb.andWhere('inventory.productId = :productId', { productId });
    }

    if (lowStock === true || lowStock === 'true') {
      qb.andWhere('inventory.quantityOnHand <= inventory.reorderLevel');
    }

    const [data, total] = await qb
      .orderBy('inventory.inventoryId', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, page, limit, totalItems: total };
  }

  async findOne(inventoryId: number): Promise<Inventory> {
    const record = await this.inventoryRepository.findOne({
      where: { inventoryId },
      relations: ['product'],
    });
    if (!record) {
      throw new NotFoundException({
        success: false,
        statusCode: 404,
        message: 'Inventory record not found.',
        errors: [`No inventory record exists with ID ${inventoryId}.`],
        timestamp: new Date().toISOString(),
      });
    }
    return record;
  }

  async update(inventoryId: number, dto: UpdateInventoryDto): Promise<Inventory> {
    await this.findOne(inventoryId);
    if (Object.keys(dto).length) {
      await this.inventoryRepository.update(inventoryId, dto);
    }
    return this.findOne(inventoryId);
  }
}
