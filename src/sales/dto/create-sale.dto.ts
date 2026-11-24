import { IsNumber, IsOptional } from 'class-validator';

export class CreateSaleDto {
  @IsOptional()
  @IsNumber()
  customerId?: number | null;
}
