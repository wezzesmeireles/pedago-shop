import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

export const useCatalogStore = defineStore('catalog', () => {
  const categories = ref<any[]>([]);
  const featuredProducts = ref<any[]>([]);

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    categories.value = data ?? [];
  }

  async function fetchFeatured() {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, compare_price, cover_image_url, is_featured, sales_count, categories(id, name, slug)')
      .eq('is_featured', true)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order')
      .limit(8);
    featuredProducts.value = data ?? [];
  }

  return { categories, featuredProducts, fetchCategories, fetchFeatured };
});
