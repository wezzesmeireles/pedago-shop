import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fetchPublicCatalog } from '@/lib/public-api';

export const useCatalogStore = defineStore('catalog', () => {
  const categories = ref<any[]>([]);
  const featuredProducts = ref<any[]>([]);

  async function fetchCategories() {
    try {
      const response = await fetchPublicCatalog();
      categories.value = [...response.categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    } catch (err) {
      console.error('fetchCategories failed:', err);
      categories.value = [];
    }
  }

  async function fetchFeatured() {
    try {
      const response = await fetchPublicCatalog();
      const catMap = Object.fromEntries(
        response.categories.map((c) => [c.$id, c])
      );

      featuredProducts.value = response.products
        .filter((p) => p.isFeatured)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .slice(0, 8)
        .map((p) => ({ ...p, category: p.categoryId ? catMap[p.categoryId] ?? null : null }));
    } catch (err) {
      console.error('fetchFeatured failed:', err);
      featuredProducts.value = [];
    }
  }

  return { categories, featuredProducts, fetchCategories, fetchFeatured };
});
