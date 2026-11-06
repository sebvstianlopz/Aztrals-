# Aztrals — website

Bilingual (ES/EN) shop for Aztrals sunglasses, Puerto Rico. Every pair is shown in real-time 3D,
built from code, and every purchase goes out as one ready-made WhatsApp message: the pairs,
their colours, the quantities and the total.

Built with [Astro](https://astro.build) as a static site and [three.js](https://threejs.org) for the 3D.
No server, no database, no payment provider.

## What's on it

- **Home**: the name AZTRALS set huge, pinned while the season's four pairs turn in one after another,
  each in front of a drawing of the place it's named after. Then the season up close, a live
  "see the island through each lens" demo, materials, every pair in one table, how to buy, questions.
- **Catalog** (`/catalogo/`, `/en/shop/`): every pair, filter by shape or lens tint, sort by price.
- **Product page** (`/catalogo/<pair>/`): drag to turn the pair in 3D, pick frame and lens (the model
  recolours), quantity, add to bag or buy straight away on WhatsApp.
- **Bag**: a drawer on every page; kept in the visitor's browser; "Send order on WhatsApp".

## Everyday changes

| I want to… | Edit |
|---|---|
| Change a price, name, description or size | `src/content/products/<pair>/data.yaml` |
| Add a pair | Copy any pair folder, rename it (the folder name becomes the URL), edit `data.yaml`, then run `npm run posters -- <folder>` |
| Add or change a colourway | Add a line under `variants:` (`frame` and `lens` must be names from `src/lib/palette.ts`), then `npm run posters -- <folder>` |
| Add a new frame colour or lens tint | `src/lib/palette.ts` |
| Hide a pair without deleting it | Add `available: false` |
| Put a pair in the season (home page story) | `season: true` (the first four by `order` are shown in the story) |
| Change the WhatsApp number, hours or Instagram | `src/config/site.ts` |
| Change any text on the site (ES and EN) | `src/i18n/index.ts` |

Each `data.yaml` is checked when the site builds. A typo (an unknown frame colour, a missing price)
stops the build with a message naming the file.

## The pictures

- **Pairs**: drawn by `src/three/glasses.ts` from a shape (wayfarer, round, cat-eye, aviator, square,
  oval), a frame finish and a lens tint. The pictures on catalog cards and in the bag are renders of
  those same models, saved as `public/products/<pair>/<colourway>.webp` by `npm run posters` (needs
  Playwright with Chromium: `npm i -D playwright && npx playwright install chromium`).
  When real product photos exist, save them over those files (4:3, pair centred on a transparent or
  plain background).
- **Places** (Condado, Culebra, Rincón, Vieques, San Juan Bay): flat drawings in
  `src/components/Place.astro` and `src/components/Bay.astro`. They can be replaced with photographs.

## Before launch

Everything marked `SAMPLE` is placeholder content to replace:

- `src/config/site.ts`: the WhatsApp number is a reserved fictional one (787-555-0100), so orders go
  nowhere until it is changed. Add the Instagram profile.
- `src/content/products/*`: names, prices, sizes and descriptions.
- `src/i18n/index.ts`: payment methods, delivery times, exchange and warranty terms in the FAQ and
  the "What they're made of" list.

## Run it locally

```sh
npm install
npm run dev        # http://localhost:4321/Aztrals-/
npm run build      # outputs dist/
npm run posters    # re-render every pair's pictures (or: npm run posters -- condado)
```

## Publishing

`.github/workflows/pages.yml` builds and publishes to GitHub Pages on every push to `main`.
One-time setup: in the repository on GitHub, go to **Settings → Pages → Build and deployment →
Source** and choose **GitHub Actions**. The site then lives at
`https://sebvstianlopz.github.io/Aztrals-/`. For a custom domain, set `SITE_URL=https://your-domain`
and `BASE_PATH=/` in the workflow's build step.
