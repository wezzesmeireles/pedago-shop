import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isMobile = env.VITE_TARGET === 'mobile';

  return {
    base: isMobile ? './' : '/',
    plugins: [
      vue(),
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
        '/v1': {
          target: 'https://appwrite.wsgestao.digital',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
