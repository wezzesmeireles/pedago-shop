import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

const PUBLIC_SELECT = {
  id: true, name: true, slug: true, description: true, richContent: true,
  price: true, comparePrice: true, coverImageUrl: true, previewImages: true,
  pageCount: true, fileSize: true, tags: true, isFeatured: true,
  salesCount: true, downloadCount: true, sortOrder: true,
  category: { select: { id: true, name: true, slug: true } },
  r2FileKey: false, // never expose
};

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryProductsDto) {
    const { category, search, tag, featured, page = 1, limit = 12, sort = 'newest' } = query;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true, deletedAt: null };
    if (category) where.category = { slug: category };
    if (tag) where.tags = { has: tag };
    if (featured) where.isFeatured = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const orderBy: any =
      sort === 'price_asc' ? { price: 'asc' }
      : sort === 'price_desc' ? { price: 'desc' }
      : sort === 'popular' ? { salesCount: 'desc' }
      : { createdAt: 'desc' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where, skip, take: limit, orderBy,
        select: {
          id: true, name: true, slug: true, price: true, comparePrice: true,
          coverImageUrl: true, isFeatured: true, salesCount: true,
          tags: true, pageCount: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      select: {
        id: true, name: true, slug: true, description: true, richContent: true,
        price: true, comparePrice: true, coverImageUrl: true, previewImages: true,
        pageCount: true, fileSize: true, tags: true, isFeatured: true,
        salesCount: true, maxDownloads: true,
        category: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!product) throw new NotFoundException('Produto não encontrado.');
    return product;
  }

  async findFeatured() {
    return this.prisma.product.findMany({
      where: { isFeatured: true, isActive: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      take: 8,
      select: {
        id: true, name: true, slug: true, price: true, comparePrice: true,
        coverImageUrl: true, isFeatured: true, salesCount: true,
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...dto,
        price: dto.price as any,
        comparePrice: dto.comparePrice as any,
        coverImageUrl: dto.coverImageUrl ?? '',
        previewImages: dto.previewImages ?? [],
        tags: dto.tags ?? [],
        fileSize: dto.fileSize ?? 0,
        r2FileKey: dto.r2FileKey ?? '',
      },
    });
  }

  async update(id: string, dto: Partial<CreateProductDto>) {
    await this.findForAdmin(id);
    return this.prisma.product.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.findForAdmin(id);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async updateFileKey(id: string, r2FileKey: string, fileSize: number) {
    return this.prisma.product.update({ where: { id }, data: { r2FileKey, fileSize } });
  }

  async findForAdmin(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Produto não encontrado.');
    return p;
  }
}
