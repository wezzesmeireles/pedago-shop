import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  coverImageUrl: string;
  slug: string;
  quantity: number;
}

const CART_STORAGE_KEY = 'cart';

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(cartItems: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(loadFromStorage());
  const isOpen = ref(false);

  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0));

  function add(product: Omit<CartItem, 'quantity'>) {
    const existing = items.value.find((i) => i.productId === product.productId);
    if (existing) {
      existing.quantity++;
    } else {
      items.value.push({ ...product, quantity: 1 });
    }
    saveToStorage(items.value);
    isOpen.value = true;
  }

  function remove(productId: string) {
    items.value = items.value.filter((i) => i.productId !== productId);
    saveToStorage(items.value);
  }

  function clear() {
    items.value = [];
    saveToStorage(items.value);
  }

  function openCart() {
    isOpen.value = true;
  }

  function closeCart() {
    isOpen.value = false;
  }

  return { items, total, count, isOpen, add, remove, clear, openCart, closeCart };
});
