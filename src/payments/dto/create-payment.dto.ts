import { IsNumber, IsInt, MaxLength, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '../payment.entity';

export class CreatePaymentDto {
  @IsInt()
  saleId: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountPaid: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  referenceNo?: string;
}


