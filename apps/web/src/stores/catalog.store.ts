import { defineStore } from 'pinia';
import { ref } from 'vue';
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';

export const useCatalogStore = defineStore('catalog', () => {
  const categories = ref<any[]>([]);
  const featuredProducts = ref<any[]>([]);

  async function fetchCategories() {
    try {
      const response = await databases.listDocuments(DB_ID, COLLECTIONS.CATEGORIES, [
        Query.equal('isActive', true),
        Query.orderAsc('sortOrder'),
      ]);
      categories.value = response.documents;
    } catch (err) {
      console.error('fetchCategories failed:', err);
      categories.value = [];
    }
  }

  async function fetchFeatured() {
    try {
      const response = await databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [
        Query.equal('isFeatured', true),
        Query.equal('isActive', true),
        Query.isNull('deletedAt'),
        Query.orderAsc('sortOrder'),
        Query.limit(8),
      ]);

      // Fetch categories separately and join in JS (Appwrite has no JOIN support)
      const catResponse = await databases.listDocuments(DB_ID, COLLECTIONS.CATEGORIES, [
        Query.limit(100),
      ]);
      const catMap = Object.fromEntries(
        catResponse.documents.map((c) => [c.$id, c])
      );

      featuredProducts.value = response.documents.map((p) => ({
        ...p,
        category: p.categoryId ? catMap[p.categoryId] ?? null : null,
      }));
    } catch (err) {
      console.error('fetchFeatured failed:', err);
      featuredProducts.value = [];
    }
  }

  return { categories, featuredProducts, fetchCategories, fetchFeatured };
});
