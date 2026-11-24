import {
  Controller,
  Get,
  Post,
  Put,
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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /api/v1/products
   * Authenticated – list / search / filter products
   */
  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('categoryId') categoryId?: number,
    @Query('brand') brand?: string,
    @Query('productStatus') productStatus?: string,
    @Query('q') q?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'ASC' | 'DESC',
    @Query('productCode') productCode?: string,
  ) {
    // Special case: search by productCode (lab endpoint 9)
    if (productCode) {
      return this.productsService.findByCode(productCode);
    }
    return this.productsService.findAll({
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
      categoryId: categoryId ? +categoryId : undefined,
      brand,
      productStatus,
      q,
      sortBy,
      order,
    });
  }

  /**
   * GET /api/v1/products/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  /**
   * POST /api/v1/products
   * Admin only
   */
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  /**
   * PUT /api/v1/products/:id
   * Admin only – full replace
   */
  @Put(':id')
  @Roles(UserRole.ADMIN)
  updateFull(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: CreateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * PATCH /api/v1/products/:id
   * Admin only – partial update
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  updatePartial(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * DELETE /api/v1/products/:id
   * Admin only
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}

