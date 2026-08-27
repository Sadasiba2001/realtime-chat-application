import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [path.resolve(__dirname, './setup.ts')],
    include: ['frontend/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: path.resolve(__dirname, '../reports/frontend-coverage'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../Chat/src'),
      'react': path.resolve(__dirname, '../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
      'lucide-react': path.resolve(__dirname, '../../Chat/node_modules/lucide-react'),
    },
    dedupe: ['react', 'react-dom', 'lucide-react'],
  },
});
