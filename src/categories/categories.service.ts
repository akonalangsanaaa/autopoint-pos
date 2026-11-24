import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, ProductType } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(
    page = 1,
    limit = 10,
    productType?: string,
  ): Promise<{ data: Category[]; page: number; limit: number; totalItems: number }> {
    if (productType && !Object.values(ProductType).includes(productType as ProductType)) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: 'Invalid query parameter.',
        errors: ['productType must be Part, Accessory, or Vehicle.'],
        timestamp: new Date().toISOString(),
      });
    }

    const query = this.categoryRepository.createQueryBuilder('category');

    if (productType) {
      query.andWhere('category.productType = :productType', { productType });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('category.categoryId', 'ASC')
      .getManyAndCount();

    return { data, page, limit, totalItems: total };
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepository.findOne({
      where: { categoryName: createCategoryDto.categoryName },
    });
    if (existing) {
      throw new ConflictException({
        success: false,
        statusCode: 409,
        message: 'Category already exists.',
        errors: [`A category named ${createCategoryDto.categoryName} already exists.`],
        timestamp: new Date().toISOString(),
      });
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findById(categoryId: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }
    return category;
  }
  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.findById(id);
    try {
      return await this.categoryRepository.save(Object.assign(category, dto));
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') throw new ConflictException('Category name already exists.');
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const result = await this.categoryRepository.delete(id);
      if (!result.affected) throw new NotFoundException('Category not found.');
    } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2') throw new ConflictException('Category has products.');
      throw error;
    }
  }
}
