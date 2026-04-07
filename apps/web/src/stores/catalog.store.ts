import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useCatalogStore = defineStore('catalog', () => {
  const categories = ref([]);
  const featuredProducts = ref([]);

  async function fetchCategories() {
    const res = await api.get('/categories');
    categories.value = res.data;
  }

  async function fetchFeatured() {
    const res = await api.get('/products/featured');
    featuredProducts.value = res.data;
  }

  return { categories, featuredProducts, fetchCategories, fetchFeatured };
});
