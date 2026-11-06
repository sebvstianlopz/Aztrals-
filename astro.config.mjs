// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages serves this repo at /Aztrals-/. With a custom domain,
// build with BASE_PATH=/ and SITE_URL=https://your-domain.
const site = process.env.SITE_URL ?? 'https://sebvstianlopz.github.io';
const base = process.env.BASE_PATH ?? '/Aztrals-';

/** Dev-only page that renders every pair to a poster image (see scripts/render-posters.mjs). */
const posterRoute = {
  name: 'poster-route',
  hooks: {
    /** @param {{ command: string, injectRoute: (r: { pattern: string, entrypoint: string }) => void }} o */
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command === 'dev') injectRoute({ pattern: '/render', entrypoint: './scripts/render-page.astro' });
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
  integrations: [
    posterRoute,
    sitemap({
      filter: (page) => !page.includes('/render'),
      i18n: { defaultLocale: 'es', locales: { es: 'es-PR', en: 'en-US' } },
    }),
  ],
});
