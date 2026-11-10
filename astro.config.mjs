// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages serves this repo at /Aztrals-/. With a custom domain,
// build with BASE_PATH=/ and SITE_URL=https://your-domain.
const site = process.env.SITE_URL ?? 'https://sebvstianlopz.github.io';
const base = process.env.BASE_PATH ?? '/Aztrals-';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'es', locales: { es: 'es-PR', en: 'en-US' } },
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});