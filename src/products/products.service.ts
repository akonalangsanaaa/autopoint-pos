import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product, ProductStatus } from './product.entity';
import { Inventory } from '../inventory/inventory.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
    private readonly categoriesService: CategoriesService,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    categoryId?: number;
    brand?: string;
    productStatus?: string;
    q?: string;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
  }) {
    const {
      page = 1,
      limit = 10,
      categoryId,
      brand,
      productStatus,
      q,
      sortBy = 'productName',
      order = 'ASC',
    } = query;

    if (sortBy && !['productName', 'unitPrice'].includes(sortBy)) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: 'Invalid query parameter.',
        errors: ['sortBy must be productName or unitPrice.'],
        timestamp: new Date().toISOString(),
      });
    }

    const qb = this.productRepository.createQueryBuilder('product');

    if (categoryId) qb.andWhere('product.categoryId = :categoryId', { categoryId });
    if (brand) qb.andWhere('product.brand = :brand', { brand });
    if (productStatus) qb.andWhere('product.productStatus = :productStatus', { productStatus });
    if (q) {
      qb.andWhere(
        '(product.productName LIKE :q OR product.productCode LIKE :q OR product.brand LIKE :q)',
        { q: `%${q}%` },
      );
    }

    const [data, total] = await qb
      .orderBy(`product.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, page, limit, totalItems: total };
  }

  async findOne(productId: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { productId },
      relations: ['category', 'inventory'],
    });
    if (!product) {
      throw new NotFoundException({
        success: false,
        statusCode: 404,
        message: 'Product not found.',
        errors: [`No product exists with ID ${productId}.`],
        timestamp: new Date().toISOString(),
      });
    }
    return product;
  }

  async findByCode(productCode: string) {
    if (productCode.length > 20) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: 'Invalid product code.',
        errors: ['productCode must not be longer than 20 characters.'],
        timestamp: new Date().toISOString(),
      });
    }

    const products = await this.productRepository.find({
      where: { productCode },
    });

    return {
      data: products,
      page: 1,
      limit: 10,
      totalItems: products.length,
    };
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Validate category exists
    await this.categoriesService.findById(createProductDto.categoryId);

    const existing = await this.productRepository.findOne({
      where: { productCode: createProductDto.productCode },
    });
    if (existing) {
      throw new ConflictException({
        success: false,
        statusCode: 409,
        message: 'Product code already exists.',
        errors: [`A product with code ${createProductDto.productCode} already exists.`],
        timestamp: new Date().toISOString(),
      });
    }

    const product = this.productRepository.create({
      ...createProductDto,
      productStatus: createProductDto.productStatus || ProductStatus.AVAILABLE,
    });

    return this.dataSource.transaction(async manager => {
      const savedProduct = await manager.save(product);
      await manager.save(manager.create(Inventory, {
        productId: savedProduct.productId,
        quantityOnHand: 0,
        reorderLevel: 5,
      }));
      return savedProduct;
    });
  }

  async update(productId: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(productId);

    if (updateProductDto.categoryId) {
      await this.categoriesService.findById(updateProductDto.categoryId);
    }

    if (updateProductDto.productCode && updateProductDto.productCode !== product.productCode) {
      const existing = await this.productRepository.findOne({
        where: { productCode: updateProductDto.productCode },
      });
      if (existing) {
        throw new ConflictException('Product code already exists');
      }
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(productId: number): Promise<void> {
    try {
      const result = await this.productRepository.delete(productId);
      if (!result.affected) throw new NotFoundException('Product not found.');
    } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        throw new ConflictException('Product has sales history. Set its status to Discontinued.');
      }
      throw error;
    }
  }
}

