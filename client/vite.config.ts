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
    // TODO: These aliases point at index.ts barrel files, which docs/conventions/general.md
    // forbids. Point each at its folder so imports name the file (`@components/Header/Header`),
    // update callers, delete the barrels, and match the paths in tsconfig.json.
    alias: {
      '@api': '/src/api/index.ts',
      '@assets': '/src/assets/index.ts',
      '@components': '/src/components/index.ts',
      '@hooks': '/src/hooks/index.ts',
      '@selectors': '/src/state/selectors/index.ts',
      '@shared': path.resolve(__dirname, '../shared'),
      '@shared/types': path.resolve(__dirname, '../shared/types/index.ts'),
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
