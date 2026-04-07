import { IsString, IsOptional, IsBoolean, IsNumber, IsUrl } from 'class-validator';

export class CreateCategoryDto {
  @IsString() name: string;
  @IsString() slug: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() imageUrl?: string;
  @IsNumber() @IsOptional() sortOrder?: number;
}
