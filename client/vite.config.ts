import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import path from 'path'

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
      '@selectors': '/src/state/selectors/index.ts',
      '@types': '/src/types/index.ts',
      '@shared/types': path.resolve(__dirname, '../shared/types/index.ts'),
      '@shared': path.resolve(__dirname, '../shared'),
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
