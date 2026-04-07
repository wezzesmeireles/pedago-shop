import { IsArray, IsUUID, IsNumber, Min, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsUUID() productId: string;
  @IsNumber() @Min(1) quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsIn(['PIX', 'CREDIT_CARD'])
  paymentMethod: 'PIX' | 'CREDIT_CARD';
}
