import { IsEnum } from 'class-validator';
import { SaleStatus } from '../sale.entity';

export class UpdateSaleDto {
  @IsEnum(SaleStatus)
  saleStatus: SaleStatus;
}
