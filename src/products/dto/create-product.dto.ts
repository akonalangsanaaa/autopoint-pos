import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';
import { ProductStatus } from '../product.entity';

export class CreateProductDto {
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  productCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  productName: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  brand?: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  productStatus?: ProductStatus;
}
