import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryProductsDto {
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @Type(() => Boolean) @Transform(({ value }) => value === 'true') featured?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() page?: number = 1;
  @IsOptional() @Type(() => Number) @IsNumber() limit?: number = 12;
  @IsOptional() @IsString() sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
}
