import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PRISMA } from '../database/database.module';

@Injectable()
export class ProductsService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  async findAll(opts: {
    categorySlug?: string;
    search?: string;
    featured?: boolean;
    free?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { categorySlug, search, featured, free, sort, page = 1, limit = 50 } = opts;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      deletedAt: null,
      ...(featured !== undefined && { isFeatured: featured }),
      ...(free && { price: { equals: new Prisma.Decimal(0) } }),
      ...(categorySlug && { category: { slug: categorySlug } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search.toLowerCase() } },
        ],
      }),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      sort === 'popular'    ? [{ salesCount: 'desc' }, { sortOrder: 'asc' }] :
      sort === 'price_asc'  ? [{ price: 'asc' }, { sortOrder: 'asc' }] :
      sort === 'price_desc' ? [{ price: 'desc' }, { sortOrder: 'asc' }] :
      /* newest (default) */ [{ sortOrder: 'asc' }, { createdAt: 'desc' }];

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true, isActive: true, sortOrder: true } } },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total, page, limit };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      include: { category: { select: { id: true, name: true, slug: true, isActive: true, sortOrder: true } } },
    });
    if (!product) throw new NotFoundException('Produto não encontrado.');
    return product;
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Produto não encontrado.');
    return product;
  }

  async create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({ data });
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    await this.findById(id);
    return this.prisma.product.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async adminFindAll(opts: { page?: number; limit?: number; search?: string; sort?: string } = {}) {
    const { page = 1, limit = 50, search, sort } = opts;
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      sort === 'salesCount' ? [{ salesCount: 'desc' }] :
      [{ sortOrder: 'asc' }, { createdAt: 'desc' }];

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true, isActive: true, sortOrder: true } } },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total, page, limit };
  }
}
