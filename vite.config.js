import { defineConfig } from 'vite';

// Relativ base, så bygget kan legges ut som statisk nettside uten ekstra oppsett.
export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
});
