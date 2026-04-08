import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(private supabase: SupabaseService) {}

  async findAll(query: QueryProductsDto) {
    const { category, search, tag, featured, page = 1, limit = 12, sort = 'newest' } = query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let q = this.supabase.db
      .from('products')
      .select(
        'id, name, slug, price, compare_price, cover_image_url, is_featured, sales_count, tags, page_count, categories(id, name, slug)',
        { count: 'exact' },
      )
      .eq('is_active', true)
      .is('deleted_at', null)
      .range(from, to);

    if (featured) q = q.eq('is_featured', true);
    if (tag) q = q.contains('tags', [tag]);
    if (search) q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    if (category) q = q.eq('categories.slug', category);

    if (sort === 'price_asc') q = q.order('price', { ascending: true });
    else if (sort === 'price_desc') q = q.order('price', { ascending: false });
    else if (sort === 'popular') q = q.order('sales_count', { ascending: false });
    else q = q.order('created_at', { ascending: false });

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    const total = count ?? 0;
    return { items: data ?? [], total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string) {
    const { data, error } = await this.supabase.db
      .from('products')
      .select(
        'id, name, slug, description, rich_content, price, compare_price, cover_image_url, preview_images, page_count, file_size, tags, is_featured, sales_count, max_downloads, categories(id, name, slug)',
      )
      .eq('slug', slug)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundException('Produto não encontrado.');
    return data;
  }

  async findFeatured() {
    const { data, error } = await this.supabase.db
      .from('products')
      .select('id, name, slug, price, compare_price, cover_image_url, is_featured, sales_count, categories(id, name, slug)')
      .eq('is_featured', true)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .limit(8);

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async create(dto: CreateProductDto) {
    const { data, error } = await this.supabase.db
      .from('products')
      .insert({
        name: dto.name,
        slug: dto.slug,
        description: dto.description ?? '',
        rich_content: dto.richContent ?? null,
        price: dto.price,
        compare_price: dto.comparePrice ?? null,
        cover_image_url: dto.coverImageUrl ?? '',
        preview_images: dto.previewImages ?? [],
        category_id: dto.categoryId,
        file_key: dto.r2FileKey ?? '',
        file_size: dto.fileSize ?? 0,
        page_count: dto.pageCount ?? null,
        tags: dto.tags ?? [],
        is_active: dto.isActive ?? true,
        is_featured: dto.isFeatured ?? false,
        sort_order: dto.sortOrder ?? 0,
        max_downloads: dto.maxDownloads ?? 5,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, dto: Partial<CreateProductDto>) {
    await this.findForAdmin(id);

    const update: any = { updated_at: new Date().toISOString() };
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.slug !== undefined) update.slug = dto.slug;
    if (dto.description !== undefined) update.description = dto.description;
    if (dto.richContent !== undefined) update.rich_content = dto.richContent;
    if (dto.price !== undefined) update.price = dto.price;
    if (dto.comparePrice !== undefined) update.compare_price = dto.comparePrice;
    if (dto.coverImageUrl !== undefined) update.cover_image_url = dto.coverImageUrl;
    if (dto.previewImages !== undefined) update.preview_images = dto.previewImages;
    if (dto.categoryId !== undefined) update.category_id = dto.categoryId;
    if (dto.r2FileKey !== undefined) update.file_key = dto.r2FileKey;
    if (dto.fileSize !== undefined) update.file_size = dto.fileSize;
    if (dto.pageCount !== undefined) update.page_count = dto.pageCount;
    if (dto.tags !== undefined) update.tags = dto.tags;
    if (dto.isActive !== undefined) update.is_active = dto.isActive;
    if (dto.isFeatured !== undefined) update.is_featured = dto.isFeatured;
    if (dto.sortOrder !== undefined) update.sort_order = dto.sortOrder;
    if (dto.maxDownloads !== undefined) update.max_downloads = dto.maxDownloads;

    const { data, error } = await this.supabase.db
      .from('products')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id: string) {
    await this.findForAdmin(id);
    const { data, error } = await this.supabase.db
      .from('products')
      .update({ deleted_at: new Date().toISOString(), is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateFileKey(id: string, fileKey: string, fileSize: number) {
    const { data, error } = await this.supabase.db
      .from('products')
      .update({ file_key: fileKey, file_size: fileSize, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async findForAdmin(id: string) {
    const { data, error } = await this.supabase.db
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Produto não encontrado.');
    return data;
  }
}
