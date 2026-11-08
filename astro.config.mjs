// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // TODO: sustituir por el dominio definitivo
  site: 'https://murales-argana-alta.pages.dev',
  vite: {
    plugins: [tailwindcss()],
  },
});
