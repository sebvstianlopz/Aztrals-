// Pure helpers shared by the bag script: no DOM here, so they are easy to reason about.

export type CatalogColorway = { name: string; variant?: string; frame: string; tint: string };
export type CatalogProduct = {
  name: string;
  price: number;
  handle: string;
  url: string;
  colorways: Record<string, CatalogColorway>;
};
export type Catalog = {
  shop: string;
  currency: string;
  locale: string;
  products: Record<string, CatalogProduct>;
};
export type Line = { s: string; c: string; q: number };

/**
 * Where "Pay" goes. When every line has a Shopify variant ID, the whole bag goes to
 * https://<shop>/cart/<variant>:<qty>,… which opens Shopify checkout with those items.
 * Otherwise the visitor finishes on the store: the product page for a single model,
 * or the full catalogue for several.
 */
export function checkoutUrl(lines: Line[], catalog: Catalog): { url: string; direct: boolean } {
  const base = `https://${catalog.shop}`;
  const known = lines.filter((l) => catalog.products[l.s]?.colorways[l.c]);
  if (!known.length) return { url: `${base}/collections/all`, direct: false };
  const variants = known.map((l) => catalog.products[l.s].colorways[l.c].variant);
  if (variants.every(Boolean)) {
    return { url: `${base}/cart/${known.map((l, i) => `${variants[i]}:${l.q}`).join(',')}`, direct: true };
  }
  const models = new Set(known.map((l) => l.s));
  if (models.size === 1) return { url: `${base}/products/${catalog.products[known[0].s].handle}`, direct: false };
  return { url: `${base}/collections/all`, direct: false };
}

export const lineProductUrl = (line: Line, catalog: Catalog) =>
  `https://${catalog.shop}/products/${catalog.products[line.s]?.handle ?? ''}`;

export function money(amount: number, catalog: Catalog): string {
  return new Intl.NumberFormat(catalog.locale, {
    style: 'currency',
    currency: catalog.currency,
    maximumFractionDigits: amount % 1 ? 2 : 0,
  }).format(amount);
}
