import {
  IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsUUID, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString() name: string;
  @IsString() slug: string;
  @IsString() description: string;
  @IsString() @IsOptional() richContent?: string;

  @IsNumber() @Min(0) @Type(() => Number)
  price: number;

  @IsNumber() @IsOptional() @Min(0) @Type(() => Number)
  comparePrice?: number;

  @IsString() @IsOptional() coverImageUrl?: string;
  @IsArray() @IsOptional() previewImages?: string[];

  @IsUUID() categoryId: string;

  @IsString() @IsOptional() r2FileKey?: string;
  @IsNumber() @IsOptional() @Type(() => Number) fileSize?: number;
  @IsNumber() @IsOptional() @Type(() => Number) pageCount?: number;

  @IsArray() @IsOptional() tags?: string[];
  @IsBoolean() @IsOptional() isActive?: boolean;
  @IsBoolean() @IsOptional() isFeatured?: boolean;
  @IsNumber() @IsOptional() @Type(() => Number) sortOrder?: number;
  @IsNumber() @IsOptional() @Type(() => Number) maxDownloads?: number;
}
