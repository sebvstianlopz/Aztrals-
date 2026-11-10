import { getCollection, type CollectionEntry } from 'astro:content';

export type Product = CollectionEntry<'products'>;
export type Colorway = Product['data']['colorways'][number];

type Mod = { default: ImageMetadata };

// Product photos: src/content/products/<slug>/<colorway id>-<n>.<ext>
const productFiles = import.meta.glob<Mod>('/src/content/products/*/*.{jpg,jpeg,png,webp,avif}', { eager: true });
// Site photos: src/assets/photos/<name>.<ext> (hero, spotlight-1…3, playa, surf, ciudad, entreno)
const siteFiles = import.meta.glob<Mod>('/src/assets/photos/*.{jpg,jpeg,png,webp,avif}', { eager: true });

const byNumber = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

export function productPhotos(slug: string, colorwayId: string): ImageMetadata[] {
  const prefix = `/src/content/products/${slug}/${colorwayId}-`;
  return Object.keys(productFiles)
    .filter((k) => k.startsWith(prefix) && !k.includes('-tryon.'))
    .sort(byNumber)
    .map((k) => productFiles[k].default);
}

/**
 * The straight-on cut-out used by the camera try-on: src/content/products/<slug>/<colorway id>-tryon.png
 * (transparent PNG, front view, lens centres at about 29% and 71% of the width).
 */
export function tryOnPhoto(slug: string, colorwayId: string): ImageMetadata | undefined {
  const key = Object.keys(productFiles).find((k) => k.startsWith(`/src/content/products/${slug}/${colorwayId}-tryon.`));
  return key ? productFiles[key].default : undefined;
}

export function sitePhoto(name: string): ImageMetadata | undefined {
  const key = Object.keys(siteFiles).find((k) => k.replace(/^.*\//, '').replace(/\.\w+$/, '') === name);
  return key ? siteFiles[key].default : undefined;
}

export async function getProducts(): Promise<Product[]> {
  const all = await getCollection('products', (p) => p.data.available);
  return all.sort((a, b) => a.data.order - b.data.order || b.data.releasedAt.getTime() - a.data.releasedAt.getTime());
}

export async function getSpotlight(): Promise<Product> {
  const all = await getProducts();
  return all.find((p) => p.data.spotlight) ?? all.find((p) => p.data.isNew) ?? all[0];
}

/** Whether the bag can hand this colourway straight to Shopify checkout. */
export const hasVariant = (c: Colorway) => Boolean(c.shopifyVariantId);
