import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receipt } from './receipt.entity';

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
  ) {}

  async findOne(receiptId: number): Promise<Receipt> {
    const receipt = await this.receiptRepository.findOne({
      where: { receiptId },
    });
    if (!receipt) {
      throw new NotFoundException({
        success: false,
        statusCode: 404,
        message: 'Receipt not found.',
        errors: [`No receipt exists with ID ${receiptId}.`],
        timestamp: new Date().toISOString(),
      });
    }
    return receipt;
  }

  async findBySaleId(saleId: number) {
    if (isNaN(saleId)) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: 'Invalid query parameter.',
        errors: ['saleId must be a number.'],
        timestamp: new Date().toISOString(),
      });
    }

    const receipts = await this.receiptRepository.find({
      where: { saleId },
    });

    return { data: receipts };
  }
}
