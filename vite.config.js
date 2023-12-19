/// <reference types="vitest" />

import path from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      include: [
        'src/**'
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/'),
      '@logger': path.resolve(__dirname, '../fairy/src/logger-fairy')
    }
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, './src/index'),
      name: 'Seele',
      fileName: 'seele',
    },
    sourcemap: true,
    target: 'esnext',
    minify: false,
  },
  plugins: [
    dts({ rollupTypes: true })
  ]
})
