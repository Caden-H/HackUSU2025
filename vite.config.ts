import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures assets are referenced relatively
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  assetsInclude: ['**/*.svg'],
});