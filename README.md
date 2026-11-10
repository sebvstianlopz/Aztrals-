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
| Change the intro line or switch the intro off | `src/config/site.ts` → `introText`, `showIntro` |

Each `data.yaml` is checked when the site builds. A typo (an unknown frame colour, a missing
price) stops the build with a message naming the file.

### Shopify checkout

The bag sends the visitor to `https://<shopDomain>/cart/<variant id>:<qty>,…`, which opens
Shopify checkout with everything in it. It needs each colourway's **variant ID**: in Shopify
admin open the product, click the variant, and copy the number at the end of the URL
(`…/variants/45123456789012`) into `shopifyVariantId: "45123456789012"`.

Until a colourway has its ID, its bag line links to the product on the store
(`https://<shopDomain>/products/<shopifyHandle>`), so nothing breaks while you fill them in.

## Intro screen

The first time someone opens the site in a browser session, a full-screen intro shows the line
"No-one catches the vision like you" over a crowd of Open Peeps walking past (the Skiper UI
"Crowd Canvas", `src/components/ui/skiper39.tsx`). It lifts after 3.5 s, or straight away on
click, Enter, Esc or scroll, and the hero plays its entrance as it does. It doesn't repeat while
the visitor moves between pages. With reduced motion the crowd stands still and the intro fades.

The crowd illustration is loaded from `cdn.21st.dev` (the Skiper UI demo's sprite). To host it
yourself, download it into `public/` and change `CROWD_SRC` in `src/components/ui/crowd-intro.tsx`.
Skiper UI's free licence asks for attribution; the credit line is in the footer.

## Colours

Black and white carry the page: a black page with white text, and white feature sections
(the release spotlight, the closing call, the footer) with black text. Grey, Purple and Pink are
for details. Picture backgrounds stay light so the glasses read clearly. The tokens are at the top
of `src/styles/global.css`.

| Colour | Used for |
|---|---|
| Black `#000000` | Page background, intro screen, text and buttons inside the white sections |
| White `#FFFFFF` | All main text on the page, primary buttons, the white feature sections |
| Grey `#9E9E9E` | Dark tints for chips, the release tile and bag lines; the AZTRALS name over the model; secondary text |
| Purple `#673AB7` | The spotlight disc, hover on white buttons, the "added" state, focus ring inside white sections |
| Pink `#FF4081` | The bag counter, text selection, the Momentos changing words, hovers inside white sections, the closing "AQUÍ", link underlines on hover, the focus ring on the page, the favicon |

## Motion

The page behaves like a pair of sunglasses: light catches the lens, a tint lowers over the view,
colours change through the lens, and the view clears at the end. Each part has its own module in
`src/scripts/motion/` (GSAP with ScrollTrigger, SplitText and Flip, plus Lenis for smooth scrolling):

| Where | What moves | Module |
|---|---|---|
| Whole site | Smooth scrolling (desktop), headings rise line by line, page-to-page crossfade and tile → product morph | `smooth.ts`, `headings.ts`, `global.css` (view transitions) |
| Hero | The full name sits in front of the model and assembles letter by letter, light sweeps across the lens, cursor depth, layered scroll exit (she stays behind the name) | `hero.ts`, `glint.ts`, `pointer.ts` |
| Lanzamientos | Curtain reveal of the tiles, tiles float at their own speeds | `releases.ts` |
| Into Rincón | The visor lowers over the page | `visor.ts` |
| Rincón | Sun rises and glasses turn (pinned), staged copy, colour flip | `spotlight.ts`, `lib/fx.ts` |
| Momentos | Heading follows the pictures, film-curtain portraits, drifting columns | `moments.ts` |
| Colección | Ripple entrance, tiles glide when filtering, count rolls | `collection.ts`, `scripts/filters.ts` |
| Closing + footer | The line develops from Grey to White, ending on a Pink "AQUÍ"; the wordmark returns | `close.ts` |
| Buttons, tiles, bag | Magnetic buttons, tile colour preview and tilt, fly-to-bag, rolling totals | `pointer.ts`, `scripts/tiles.ts`, `scripts/bag.ts`, `lib/fx.ts` |

With reduced motion turned on, everything shows in its final state and nothing slides. Touch
screens keep native scrolling and skip the cursor effects.

## React, Tailwind and shadcn/ui

The site is Astro, with React (`@astrojs/react`) for interactive components and Tailwind CSS v4
(`@tailwindcss/vite`). It follows the shadcn/ui structure, so `npx shadcn@latest add <component>`
works:

- `components.json`: shadcn config. Components go to `src/components/ui` (`@/components/ui`).
- `@/` points at `src/` (`tsconfig.json`), and `src/lib/utils.ts` has the `cn()` helper.
- `src/styles/tailwind.css` loads Tailwind's theme and utilities only. Its Preflight reset is left
  out on purpose: `src/styles/global.css` already resets the page and the design relies on it.

React components only run on the page where they are used, with a `client:` directive
(see `src/components/Intro.astro`).

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
