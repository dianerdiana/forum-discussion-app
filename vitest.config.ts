import { defineConfig } from 'vitest/config';

import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/*': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/configs': path.resolve(__dirname, './src/configs'),
      '@/schemas': path.resolve(__dirname, './src/schemas'),
      '@/layouts': path.resolve(__dirname, './src/layouts'),
      '@/assets': path.resolve(__dirname, './src/assets'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/redux': path.resolve(__dirname, './src/redux'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/configs/test/setup.ts'],
    globals: true,
  },
});
