# Aztrals — website

Bilingual (ES/EN) shop for Aztrals sunglasses, Puerto Rico. Every pair can be turned in 360°, and
every purchase goes out as one ready-made WhatsApp message: the pairs, their colours, the
quantities and the total.

Built with [Astro](https://astro.build) as a static site. No server, no database, no payment provider.
[three.js](https://threejs.org) draws the stand-in product renders at build time only.

## What's on it

- **Home**: full-width hero photo with the season's name, the season's pairs as product cards, a
  featured pair you can turn in 360°, the full collection, benefits and questions.
- **Catalog** (`/catalogo/`, `/en/shop/`): every pair, filter by shape or lens tint, sort by price.
- **Product page** (`/catalogo/<pair>/`): drag to turn the pair in 360°, pick a colourway, quantity,
  add to bag or buy straight away on WhatsApp, details in accordions.
- **Bag**: a drawer on every page; kept in the visitor's browser; "Send order on WhatsApp".

## Everyday changes

| I want to… | Edit |
|---|---|
| Change a price, name, description or size | `src/content/products/<pair>/data.yaml` |
| Add a pair | Copy any pair folder, rename it (the folder name becomes the URL), edit `data.yaml`, add its photos (below) or run `npm run posters -- <folder>` |
| Add or change a colourway | Add a line under `variants:` (`frame` and `lens` must be names from `src/lib/palette.ts`) |
| Show a badge on a card | `badge: nuevo`, `temporada` or `mas-vendido` |
| Choose the featured pair on the home page | `featured: true` on that pair |
| Put a pair in the season grid | `season: true` (the first four by `order` are shown) |
| Hide a pair without deleting it | `available: false` |
| Change the WhatsApp number, hours or Instagram | `src/config/site.ts` |
| Change any text on the site (ES and EN) | `src/i18n/index.ts` |

Each `data.yaml` is checked when the site builds. A typo (an unknown frame colour, a missing price)
stops the build with a message naming the file.

## Photos

Drop photos into these folders; nothing else needs editing. Any size works, the build makes
web-sized copies. JPG, PNG, WebP or AVIF.

| Photo | Where |
|---|---|
| Home hero (landscape, ≥ 2400 × 1350) | `src/assets/site/hero.jpg` |
| Home hero for phones (portrait, optional) | `src/assets/site/hero-mobile.jpg` |
| A colourway, ¾ view on white or light grey (4:3) | `src/content/products/<pair>/<colourway>/main.jpg` |
| Second view shown when a card is hovered (optional) | `src/content/products/<pair>/<colourway>/front.jpg` |
| 360° turn: photos taken evenly around the pair, same framing (optional, 24 is ideal) | `src/content/products/<pair>/<colourway>/spin/01.jpg`, `02.jpg`, … |
| Lifestyle or detail photos of a pair (optional) | `src/content/products/<pair>/gallery/*.jpg` |

`<colourway>` is the variant `id` in `data.yaml`, e.g. `src/content/products/condado/negro-ambar/main.jpg`.

Until a photo exists, the site uses renders of code-drawn models from `public/renders/` (made by
`npm run posters`, which needs Playwright: `npm i -D playwright && npx playwright install chromium`).

## Before launch

Everything marked `SAMPLE` is placeholder content to replace:

- `src/config/site.ts`: the WhatsApp number is a reserved fictional one (787-555-0100), so orders go
  nowhere until it is changed. Add the Instagram profile.
- `src/content/products/*`: names, prices, sizes and descriptions.
- `src/i18n/index.ts`: payment methods, delivery times, exchange and warranty terms in the FAQ,
  the benefits row and the product page.
- Photos: hero and product photos (see **Photos**).

## Run it locally

```sh
npm install
npm run dev        # http://localhost:4321/Aztrals-/
npm run build      # outputs dist/
npm run posters    # re-render the stand-in pictures and 360° frames (or: npm run posters -- condado)
```

## Publishing

`.github/workflows/pages.yml` builds and publishes to GitHub Pages on every push to `main`.
One-time setup: in the repository on GitHub, go to **Settings → Pages → Build and deployment →
Source** and choose **GitHub Actions**. The site then lives at
`https://sebvstianlopz.github.io/Aztrals-/`. For a custom domain, set `SITE_URL=https://your-domain`
and `BASE_PATH=/` in the workflow's build step.
