import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ProductType } from '../category.entity';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  categoryName: string;

  @IsEnum(ProductType)
  productType: ProductType;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  description?: string;
}
