import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { StorageService } from '../storage/storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@pedago/shared';

@Controller('products')
export class ProductsController {
  constructor(
    private svc: ProductsService,
    private storage: StorageService,
  ) {}

  @Get()
  findAll(@Query() query: QueryProductsDto) {
    return this.svc.findAll(query);
  }

  @Get('featured')
  featured() {
    return this.svc.findFeatured();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: Partial<CreateProductDto>) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }

  @Post(':id/upload-pdf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo não enviado.');
    if (file.mimetype !== 'application/pdf') throw new BadRequestException('Apenas PDFs são aceitos.');
    if (file.size > 50 * 1024 * 1024) throw new BadRequestException('Arquivo muito grande (max 50MB).');

    const fileId = await this.storage.upload(file.originalname, file.buffer, file.mimetype, false);
    await this.svc.updateFileKey(id, fileId, file.size);
    return { fileId, size: file.size };
  }

  @Post(':id/upload-cover')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadCover(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo não enviado.');
    const url = await this.storage.upload(file.originalname, file.buffer, file.mimetype, true);
    await this.svc.update(id, { coverImageUrl: url });
    return { url };
  }
}
