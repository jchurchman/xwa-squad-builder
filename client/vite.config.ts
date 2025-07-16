import react from '@vitejs/plugin-react';
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
      '@api': '/src/api/index.ts',
      '@assets': '/src/assets/index.ts',
      '@components': '/src/components/index.ts',
      '@hooks': '/src/hooks/index.ts',
      '@types': '/src/types/index.ts',
      src: '/src',
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
