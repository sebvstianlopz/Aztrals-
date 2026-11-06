// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages serves this repo at /Aztrals-/. With a custom domain,
// build with BASE_PATH=/ and SITE_URL=https://your-domain.
const site = process.env.SITE_URL ?? 'https://sebvstianlopz.github.io';
const base = process.env.BASE_PATH ?? '/Aztrals-';

/** Dev-only pages that render product pictures and hero frames (see scripts/render-*.mjs). */
const renderRoutes = {
  name: 'render-routes',
  hooks: {
    /** @param {{ command: string, injectRoute: (r: { pattern: string, entrypoint: string }) => void }} o */
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command !== 'dev') return;
      injectRoute({ pattern: '/render', entrypoint: './scripts/render-page.astro' });
      injectRoute({ pattern: '/render-hero', entrypoint: './scripts/render-hero-page.astro' });
    },
  },
};

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
  vite: { plugins: [tailwindcss()] },
  integrations: [
    renderRoutes,
    react(),
    sitemap({
      filter: (page) => !page.includes('/render'),
      i18n: { defaultLocale: 'es', locales: { es: 'es-PR', en: 'en-US' } },
    }),
  ],
});
