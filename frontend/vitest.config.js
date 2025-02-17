import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    include: ['**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    alias: {
      '@': resolve(__dirname, './src'),
    },
    deps: {
      inline: [
        '@mui/material',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled',
      ],
    },
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
    reporters: ['default', 'html'],
    watch: false,
    testTimeout: 10000,
    maxConcurrency: 5,
    sequence: {
      shuffle: true,
    },
    // Add custom matchers
    extend: {
      chai: {
        utils: {
          addMethod(ctx, name, fn) {
            ctx[name] = fn;
          },
        },
      },
    },
    // Configure snapshot settings
    snapshotFormat: {
      printBasicPrototype: false,
      escapeString: true,
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
