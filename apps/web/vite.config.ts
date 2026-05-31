import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
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
