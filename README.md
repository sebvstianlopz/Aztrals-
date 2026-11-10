# Aztrals — website

Bilingual (ES/EN) shop site for Aztrals sunglasses, Puerto Rico. It shows the new releases first,
then the whole collection. Visitors fill a bag on the site and check out on the Aztrals
**Shopify** store.

Built with [Astro](https://astro.build) as a static site, GSAP for the scroll motion.
No server, no database.

## Everyday changes

| I want to… | Edit |
|---|---|
| Set the store | `src/config/site.ts` → `shopDomain` (e.g. `aztrals.com` or `aztrals.myshopify.com`) |
| Change a price, name or text | `src/content/products/<model>/data.yaml` |
| Add a model | Copy any folder in `src/content/products/`, rename it (the folder name becomes the URL) and edit `data.yaml` |
| Show a model in "Lanzamientos" | `isNew: true` (the four newest by `releasedAt` are shown) |
| Choose the model of the dark release section | `spotlight: true` on one model |
| Hide a model | `available: false` |
| Let the bag check out straight on Shopify | Add `shopifyVariantId` to each colourway (see below) |
| Add product photos | See "Photos" below |
| Change any text on the site | `src/i18n/index.ts` (Spanish and English side by side) |
| Instagram link | `src/config/site.ts` → `social.instagram` |

Each `data.yaml` is checked when the site builds. A typo (an unknown frame colour, a missing
price) stops the build with a message naming the file.

### Shopify checkout

The bag sends the visitor to `https://<shopDomain>/cart/<variant id>:<qty>,…`, which opens
Shopify checkout with everything in it. It needs each colourway's **variant ID**: in Shopify
admin open the product, click the variant, and copy the number at the end of the URL
(`…/variants/45123456789012`) into `shopifyVariantId: "45123456789012"`.

Until a colourway has its ID, its bag line links to the product on the store
(`https://<shopDomain>/products/<shopifyHandle>`), so nothing breaks while you fill them in.

## Photos

Every picture slot shows a drawing until its photo exists. To replace them:

- **Product photos**: put them in the model's folder named after the colourway id and a number:
  `src/content/products/rincon/negro-sol-1.png`, `negro-sol-2.png`, `negro-sol-3.png`.
  Photo 1 is the tile and main picture; on the release section photos 1–3 play in turn as the
  visitor scrolls (front, three-quarter, side). Transparent PNG cut-outs work best, because
  they sit on both the light tiles and the black release section. Square, at least 1600 px.
- **Site photos**: the hero photo is in place (`src/assets/photos/hero.webp`); the four
  "Momentos" pictures go in the same folder (names in the README there).

## Run it locally

```sh
npm install
npm run dev      # http://localhost:4321/Aztrals-/
npm run build    # outputs dist/
```

## Publishing

`.github/workflows/pages.yml` builds and publishes to GitHub Pages on every push to `main`.
One-time setup: in the repository on GitHub, go to **Settings → Pages → Build and deployment →
Source** and choose **GitHub Actions**. The site then lives at
`https://sebvstianlopz.github.io/Aztrals-/`. For a custom domain, build with `SITE_URL=https://your-domain`
and `BASE_PATH=/`.

## Before launch

Everything marked `SAMPLE` in the code is placeholder content to confirm or replace:
the seven models, prices and descriptions, `shopDomain`, the variant IDs, the Instagram link,
the shipping/exchange lines (`terms` in `src/i18n/index.ts`) and which model each "Momentos"
picture shows (`src/components/home/Moments.astro`).
