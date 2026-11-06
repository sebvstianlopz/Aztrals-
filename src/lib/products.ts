import { getCollection, type CollectionEntry } from 'astro:content';
import { frames, lenses, type FrameId, type LensId, type Text } from './palette';
import { asset, path } from '../i18n';
import type { Lang } from '../config/site';

export type Product = CollectionEntry<'products'>;
export type Variant = Product['data']['variants'][number];

export async function getProducts(): Promise<Product[]> {
  const all = await getCollection('products', (p) => p.data.available);
  return all.sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name));
}

export const poster = (slug: string, variant: string) => asset(`products/${slug}/${variant}.webp`);

/** "Negro, lente ámbar" · "Black, amber lens" */
export const variantName = (v: { frame: FrameId; lens: LensId }, lang: Lang) => {
  const lens = lenses[v.lens].name[lang].toLowerCase();
  return lang === 'es' ? `${frames[v.frame].name[lang]}, lente ${lens}` : `${frames[v.frame].name[lang]}, ${lens} lens`;
};

export const money = (n: number, lang: Lang) =>
  new Intl.NumberFormat(lang === 'es' ? 'es-PR' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

/** What the browser needs to know about a pair: for the bag, the 3D stages and filters. */
export interface ClientProduct {
  slug: string;
  name: string;
  price: number;
  shape: Product['data']['shape'];
  season: boolean;
  url: Text;
  variants: { id: string; frame: FrameId; lens: LensId; name: Text; poster: string; field: string }[];
}

export const toClient = (p: Product): ClientProduct => ({
  slug: p.id,
  name: p.data.name,
  price: p.data.price,
  shape: p.data.shape,
  season: p.data.season,
  url: { es: path('es', 'shop', p.id), en: path('en', 'shop', p.id) },
  variants: p.data.variants.map((v) => ({
    id: v.id,
    frame: v.frame,
    lens: v.lens,
    name: { es: variantName(v, 'es'), en: variantName(v, 'en') },
    poster: poster(p.id, v.id),
    field: lenses[v.lens].field,
  })),
});
