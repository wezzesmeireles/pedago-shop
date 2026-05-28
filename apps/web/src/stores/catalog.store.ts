import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/lib/apiClient';

export const useCatalogStore = defineStore('catalog', () => {
  const categories = ref<any[]>([]);
  const featuredProducts = ref<any[]>([]);

  async function fetchCategories() {
    try {
      categories.value = await api.get<any[]>('/categories');
    } catch {
      categories.value = [];
    }
  }

  async function fetchFeatured() {
    try {
      const result = await api.get<{ products: any[]; total: number }>(
        '/products?featured=true&limit=8',
      );
      featuredProducts.value = Array.isArray(result)
        ? result
        : (result as any).products ?? [];
    } catch {
      featuredProducts.value = [];
    }
  }

  return { categories, featuredProducts, fetchCategories, fetchFeatured };
});
