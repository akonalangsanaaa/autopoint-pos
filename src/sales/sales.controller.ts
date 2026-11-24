import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { AddSaleItemDto } from './dto/add-sale-item.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * GET /api/v1/sales
   */
  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('saleStatus') saleStatus?: string,
    @Query('userId') userId?: number,
    @Query('customerId') customerId?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.salesService.findAll({
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
      saleStatus,
      userId: userId ? +userId : undefined,
      customerId: customerId ? +customerId : undefined,
      dateFrom,
      dateTo,
    });
  }

  /**
   * GET /api/v1/sales/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }

  /**
   * POST /api/v1/sales
   * Start a new sale
   */
  @Post()
  create(
    @Body() createSaleDto: CreateSaleDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.salesService.create(createSaleDto, userId);
  }

  /**
   * PATCH /api/v1/sales/:id
   * Cancel a sale
   */
  @Patch(':id')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSaleDto: UpdateSaleDto,
  ) {
    return this.salesService.cancel(id, updateSaleDto);
  }

  /**
   * GET /api/v1/sales/:id/items
   */
  @Get(':id/items')
  getItems(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.getItems(id);
  }

  /**
   * POST /api/v1/sales/:id/items
   * Add product to sale
   */
  @Post(':id/items')
  addItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() addSaleItemDto: AddSaleItemDto,
  ) {
    return this.salesService.addItem(id, addSaleItemDto);
  }

  /**
   * DELETE /api/v1/sales/:id/items/:itemId
   */
  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.salesService.removeItem(id, itemId);
  }
}
