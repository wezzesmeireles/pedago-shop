import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import legacy from '@vitejs/plugin-legacy';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isMobile = env.VITE_TARGET === 'mobile';

  return {
    base: isMobile ? './' : '/',
    plugins: [
      vue(),
      ...(!isMobile ? [VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: [
          'favicon.ico',
          'favicon-16.png',
          'favicon-32.png',
          'favicon-180.png',
          'favicon-192.png',
          'favicon-512.png',
          'site-pedagogico-logo.png',
        ],
        manifest: {
          id: '/',
          name: 'Site Pedagógico — Atividades em PDF',
          short_name: 'Site Pedagógico',
          description: 'Materiais e atividades pedagógicas digitais para imprimir.',
          lang: 'pt-BR',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait-primary',
          background_color: '#fffafc',
          theme_color: '#7d4aa8',
          categories: ['education', 'shopping'],
          icons: [
            { src: '/favicon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/favicon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/favicon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/v1\//],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          importScripts: ['/pwa-push.js'],
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) =>
                request.destination === 'image' && url.origin === self.location.origin,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'site-pedagogico-images',
                expiration: { maxEntries: 80, maxAgeSeconds: 7 * 24 * 60 * 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'site-pedagogico-fonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          navigateFallback: 'index.html',
        },
      })] : []),
      // Fallback bundle para browsers antigos (Chrome <64, Safari <12, etc.)
      // modernPolyfills: false → não injeta polyfills desnecessários no bundle moderno (economiza ~34 kB gzip)
      legacy({
        targets: ['defaults', 'chrome >= 64', 'safari >= 12', 'firefox >= 67', 'not IE 11'],
        modernPolyfills: false,
        renderLegacyChunks: true,
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@sitepedagogico/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
      },
    },
    optimizeDeps: {
      include: ['@sitepedagogico/shared'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Appwrite SDK sozinho (~80 kB) — cache separado do resto
            if (id.includes('node_modules/appwrite')) return 'vendor-appwrite';
            // Vue core + router + pinia
            if (
              id.includes('node_modules/vue/') ||
              id.includes('node_modules/@vue/') ||
              id.includes('node_modules/vue-router') ||
              id.includes('node_modules/pinia')
            ) return 'vendor-vue';
            // @vueuse (head, core, etc.)
            if (id.includes('node_modules/@vueuse')) return 'vendor-vueuse';
            // Restante de node_modules
            if (id.includes('node_modules')) return 'vendor-misc';
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'https://www.sitepedagogico.com',
          changeOrigin: true,
          secure: true,
        },
        '/v1': {
          target: 'https://appwrite.wsgestao.digital',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
