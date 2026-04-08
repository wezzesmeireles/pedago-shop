import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private supabase: SupabaseService) {}

  async findAll(onlyActive = true) {
    let query = this.supabase.db
      .from('categories')
      .select('*, products(count)')
      .order('sort_order', { ascending: true });

    if (onlyActive) query = query.eq('is_active', true);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async findBySlug(slug: string) {
    const { data: cat, error } = await this.supabase.db
      .from('categories')
      .select('*, products!inner(id, name, slug, price, compare_price, cover_image_url, is_featured, sales_count)')
      .eq('slug', slug)
      .eq('products.is_active', true)
      .is('products.deleted_at', null)
      .single();

    if (error || !cat) throw new NotFoundException('Categoria não encontrada.');
    return cat;
  }

  async create(dto: CreateCategoryDto) {
    const { data: existing } = await this.supabase.db
      .from('categories')
      .select('id')
      .eq('slug', dto.slug)
      .single();

    if (existing) throw new ConflictException('Slug já existe.');

    const { data, error } = await this.supabase.db
      .from('categories')
      .insert({
        name: dto.name,
        slug: dto.slug,
        description: dto.description ?? null,
        image_url: dto.imageUrl ?? null,
        sort_order: dto.sortOrder ?? 0,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, dto: Partial<CreateCategoryDto> & { isActive?: boolean }) {
    await this.findById(id);

    const { data, error } = await this.supabase.db
      .from('categories')
      .update({
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.imageUrl !== undefined && { image_url: dto.imageUrl }),
        ...(dto.sortOrder !== undefined && { sort_order: dto.sortOrder }),
        ...(dto.isActive !== undefined && { is_active: dto.isActive }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id: string) {
    await this.findById(id);
    return this.update(id, { isActive: false });
  }

  private async findById(id: string) {
    const { data, error } = await this.supabase.db
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Categoria não encontrada.');
    return data;
  }
}
