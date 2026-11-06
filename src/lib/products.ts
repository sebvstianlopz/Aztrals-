import { getCollection, type CollectionEntry } from 'astro:content';
import { frames, lenses, type FrameId, type LensId, type Text } from './palette';
import { path } from '../i18n';
import { pictures, type Pictures } from './media';
import type { Lang } from '../config/site';

export type Product = CollectionEntry<'products'>;
export type Variant = Product['data']['variants'][number];

export async function getProducts(): Promise<Product[]> {
  const all = await getCollection('products', (p) => p.data.available);
  return all.sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name));
}

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
  badge?: string;
  variants: { id: string; frame: FrameId; lens: LensId; name: Text; poster: string; field: string; pics: Pictures }[];
}

export const toClient = async (p: Product): Promise<ClientProduct> => ({
  slug: p.id,
  name: p.data.name,
  price: p.data.price,
  shape: p.data.shape,
  season: p.data.season,
  badge: p.data.badge,
  url: { es: path('es', 'shop', p.id), en: path('en', 'shop', p.id) },
  variants: await Promise.all(
    p.data.variants.map(async (v) => {
      const pics = await pictures(p.id, v.id);
      return {
        id: v.id,
        frame: v.frame,
        lens: v.lens,
        name: { es: variantName(v, 'es'), en: variantName(v, 'en') },
        poster: pics.main,
        field: lenses[v.lens].field,
        pics,
      };
    }),
  ),
});

/** Client data for every pair, cached for the build. */
let cache: Promise<ClientProduct[]> | null = null;
export const clientCatalog = () => (cache ??= getProducts().then((all) => Promise.all(all.map(toClient))));
