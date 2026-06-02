import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    // Ship a transpiled + polyfilled fallback bundle (<script nomodule>) so the
    // site still loads on older devices/browsers (old school PCs, old Android/
    // iOS) — otherwise the modern-only ESM bundle gives them a blank page.
    legacy({
      targets: ['defaults', 'chrome >= 64', 'safari >= 12', 'firefox >= 67', 'not IE 11'],
      modernPolyfills: true,
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
});
