// Where every picture of a pair comes from. Real photos win; rendered stand-ins fill the gaps.
//
// Drop photos in (no other edits needed):
//   src/assets/site/hero.jpg                                   home page hero (landscape)
//   src/assets/site/hero-mobile.jpg                            optional, portrait, for phones
//   src/content/products/<pair>/<colourway>/main.jpg           the pair, ¾ view, on white (4:3)
//   src/content/products/<pair>/<colourway>/front.jpg          optional, shown when a card is hovered
//   src/content/products/<pair>/<colourway>/spin/01.jpg …      optional 360° turn, evenly spaced
//   src/content/products/<pair>/gallery/*.jpg                  optional lifestyle and detail photos
import { getImage } from 'astro:assets';
import { asset } from '../i18n';

type Img = { default: ImageMetadata };

const variantPhotos = import.meta.glob<Img>('/src/content/products/*/*/{main,front}.{jpg,jpeg,png,webp,avif}', { eager: true });
const spinPhotos = import.meta.glob<Img>('/src/content/products/*/*/spin/*.{jpg,jpeg,png,webp,avif}', { eager: true });
const galleryPhotos = import.meta.glob<Img>('/src/content/products/*/gallery/*.{jpg,jpeg,png,webp,avif}', { eager: true });
const sitePhotos = import.meta.glob<Img>('/src/assets/site/*.{jpg,jpeg,png,webp,avif}', { eager: true });

const find = (map: Record<string, Img>, prefix: string, name?: string) =>
  Object.entries(map)
    .filter(([k]) => k.startsWith(prefix) && (!name || k.slice(prefix.length).replace(/\.\w+$/, '') === name))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([, v]) => v.default);

const webp = async (src: ImageMetadata, width: number) => (await getImage({ src, width: Math.min(width, src.width), format: 'webp', quality: 82 })).src;

export const SPIN_FRAMES = 24;

export interface Pictures {
  /** Main picture of the colourway. */
  main: string;
  /** Second picture for hover, if there is a photo for it. */
  front?: string;
  /** Frames of the 360° turn (one frame when only a main photo exists). */
  spin: string[];
  /** True when these are real photos, false for rendered stand-ins. */
  photo: boolean;
}

export async function pictures(slug: string, variant: string): Promise<Pictures> {
  const dir = `/src/content/products/${slug}/${variant}/`;
  const main = find(variantPhotos, dir, 'main')[0];
  const front = find(variantPhotos, dir, 'front')[0];
  const spin = find(spinPhotos, `${dir}spin/`);
  const render = (p: string) => asset(`renders/${slug}/${variant}/${p}.webp`);
  if (main || spin.length) {
    const mainUrl = main ? await webp(main, 1400) : await webp(spin[0], 1400);
    return {
      main: mainUrl,
      front: front ? await webp(front, 1400) : undefined,
      spin: spin.length ? await Promise.all(spin.map((s) => webp(s, 1400))) : [mainUrl],
      photo: true,
    };
  }
  return {
    main: render('main'),
    spin: Array.from({ length: SPIN_FRAMES }, (_, i) => render(`spin/${String(i + 1).padStart(2, '0')}`)),
    photo: false,
  };
}

/** Lifestyle and detail photos of a pair, large and as thumbnails. */
export async function gallery(slug: string) {
  return Promise.all(
    find(galleryPhotos, `/src/content/products/${slug}/gallery/`).map(async (src) => ({
      large: await webp(src, 1600),
      thumb: await webp(src, 240),
      width: src.width,
      height: src.height,
    })),
  );
}

/** The home hero photo(s), if they have been added. */
export function heroPhotos() {
  return {
    desktop: find(sitePhotos, '/src/assets/site/', 'hero')[0],
    mobile: find(sitePhotos, '/src/assets/site/', 'hero-mobile')[0],
  };
}
