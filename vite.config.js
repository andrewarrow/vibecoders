import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve('./static'),
  build: {
    outDir: resolve('./static/dist'),
    emptyOutDir: true,
    assetsInlineLimit: 0,
    //minify: false, // Disable minification
    //sourcemap: true,
  },
  publicDir: resolve('./static/public'),
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
