import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('receipts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  /**
   * GET /api/v1/receipts/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.receiptsService.findOne(id);
  }

  /**
   * GET /api/v1/receipts?saleId=xxx
   */
  @Get()
  findBySaleId(@Query('saleId') saleId: string) {
    return this.receiptsService.findBySaleId(+saleId);
  }
}
