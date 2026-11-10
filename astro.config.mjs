// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // TODO: replace with the final domain
  site: 'https://murales-argana-alta.pages.dev',
  vite: {
    plugins: [tailwindcss()],
  },
});
