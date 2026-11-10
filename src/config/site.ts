// Everything about the business that is not a product lives here.
// SAMPLE values are marked; replace them before launch.

export type Lang = 'es' | 'en';

export const site = {
  name: 'Aztrals',
  place: { es: 'Puerto Rico', en: 'Puerto Rico' },
  currency: 'USD',
  /**
   * The Shopify store, without https:// (e.g. "aztrals.com" or "aztrals.myshopify.com").
   * SAMPLE: replace with the real store domain. Checkout and "Buy on the store" links use it.
   */
  shopDomain: 'your-store.myshopify.com',
  /** The crowd intro screen shown once per visit. Set to false to switch it off. */
  showIntro: true,
  /** The line on the intro screen (the same in both languages). */
  introText: 'No-one catches the vision like you',
  social: {
    // Full profile URL. Empty hides the link. SAMPLE
    instagram: '' as string,
  },
} as const;

export const shopUrl = (p = '') => `https://${site.shopDomain}${p}`;
