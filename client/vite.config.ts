import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@shared': path.resolve(__dirname, '../shared'),
      '@shared/types': path.resolve(__dirname, '../shared/types/index.ts'),
    },
  },
  server: {
    proxy: {
      '/api': {
        changeOrigin: true,
        target: 'http://localhost:3001',
      },
    },
  },
});
