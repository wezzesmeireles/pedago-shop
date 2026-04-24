import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

let authReady = false;

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    // Public
    {
      path: '/',
      component: () => import('@/components/layout/PublicLayout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('@/views/public/HomeView.vue') },
        { path: 'catalogo', name: 'catalog', component: () => import('@/views/public/CatalogView.vue') },
        { path: 'produto/:slug', name: 'product', component: () => import('@/views/public/ProductView.vue') },
        { path: 'checkout', name: 'checkout', component: () => import('@/views/public/CheckoutView.vue'), meta: { requiresAuth: true } },
        { path: 'checkout/success/:orderId', name: 'checkout-success', component: () => import('@/views/public/CheckoutSuccessView.vue'), meta: { requiresAuth: true } },
        { path: 'checkout/failure/:orderId', name: 'checkout-failure', component: () => import('@/views/public/CheckoutFailureView.vue') },
        { path: 'contato', name: 'contact', component: () => import('@/views/public/ContactView.vue') },
        { path: 'quem-somos', name: 'about', component: () => import('@/views/public/AboutView.vue') },
        { path: 'politica-privacidade', name: 'privacy', component: () => import('@/views/public/PrivacyView.vue') },
      ],
    },
    // Auth
    {
      path: '/auth',
      component: () => import('@/components/layout/AuthLayout.vue'),
      children: [
        { path: 'login', name: 'login', component: () => import('@/views/auth/LoginView.vue') },
        { path: 'register', name: 'register', component: () => import('@/views/auth/RegisterView.vue') },
        { path: 'google-callback', name: 'google-callback', component: () => import('@/views/auth/GoogleCallbackView.vue') },
        { path: 'whatsapp', name: 'phone-required', component: () => import('@/views/auth/PhoneRequiredView.vue') },
        { path: 'esqueci-senha', name: 'forgot-password', component: () => import('@/views/auth/ForgotPasswordView.vue') },
        { path: 'reset-senha', name: 'reset-password', component: () => import('@/views/auth/ResetPasswordView.vue') },
      ],
    },
    // Admin login (standalone, no layout)
    { path: '/admin/login', name: 'admin-login', component: () => import('@/views/auth/AdminLoginView.vue') },
    // Customer area
    {
      path: '/minha-conta',
      component: () => import('@/components/layout/CustomerLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: { name: 'orders' } },
        { path: 'pedidos', name: 'orders', component: () => import('@/views/customer/OrdersView.vue') },
        { path: 'downloads', name: 'downloads', component: () => import('@/views/customer/DownloadsView.vue') },
      ],
    },
    // Admin
    {
      path: '/admin',
      component: () => import('@/components/layout/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        { path: '', redirect: { name: 'admin-dashboard' } },
        { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/views/admin/DashboardView.vue') },
        { path: 'produtos', name: 'admin-products', component: () => import('@/views/admin/ProductsView.vue') },
        { path: 'categorias', name: 'admin-categories', component: () => import('@/views/admin/CategoriesView.vue') },
        { path: 'pedidos', name: 'admin-orders', component: () => import('@/views/admin/OrdersView.vue') },
        { path: 'usuarios', name: 'admin-users', component: () => import('@/views/admin/UsersView.vue') },
        { path: 'customizar', name: 'admin-customize', component: () => import('@/views/admin/CustomizeView.vue') },
        { path: 'integracoes', name: 'admin-integrations', component: () => import('@/views/admin/IntegrationsView.vue') },
        { path: 'changelog', name: 'admin-changelog', component: () => import('@/views/admin/ChangelogView.vue') },
      ],
    },
    // 404
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/public/NotFoundView.vue') },
  ],
});

const AUTH_ROUTE_NAMES = ['login', 'register', 'google-callback', 'phone-required', 'forgot-password', 'reset-password', 'admin-login'];

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!authReady) {
    await auth.init();
    authReady = true;
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (to.meta.requiresAdmin && auth.user?.role !== 'ADMIN') {
    return { name: 'admin-login' };
  }

  // Redirect authenticated users without phone to phone-required (skip auth/admin routes)
  if (auth.isLoggedIn && !auth.user?.phone && !AUTH_ROUTE_NAMES.includes(to.name as string)) {
    return { name: 'phone-required', query: { redirect: to.fullPath } };
  }
});

export default router;
