import type { Lang } from '../config/site';

const routes = {
  home: { es: '', en: 'en/' },
  shop: { es: 'tienda/', en: 'en/shop/' },
} as const;

export type RouteKey = keyof typeof routes;

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

/** Internal URL for a page, with the deploy base path and a trailing slash. */
export function path(lang: Lang, key: RouteKey, slug?: string): string {
  return base + routes[key][lang] + (slug ? `${slug}/` : '');
}

export const asset = (p: string) => base + p.replace(/^\//, '');

// SAMPLE: shipping and returns terms in `terms` and `faq` must be confirmed by Aztrals.
const es = {
  locale: 'es-PR',
  switchTo: 'English',
  switchShort: 'EN',
  skip: 'Saltar al contenido',
  intro: { enter: 'Entrar', label: 'Bienvenida a Aztrals' },
  nav: { releases: 'Lanzamientos', moments: 'Momentos', shop: 'Tienda', bag: 'Bolsa', home: 'Aztrals, inicio' },
  meta: {
    homeTitle: 'Aztrals · Gafas de sol en Puerto Rico',
    homeDescription: 'Gafas de sol polarizadas y deportivas, hechas para la luz de Puerto Rico. Mira los nuevos lanzamientos y compra en la tienda Aztrals.',
    shopTitle: 'Tienda · Aztrals',
    shopDescription: 'Todos los modelos de gafas de sol Aztrals, con precio y colores. Compra en línea con envío en Puerto Rico.',
  },
  hero: {
    title: 'Ve más allá del sol',
    text: 'Gafas de sol polarizadas para la luz fuerte de Puerto Rico: la playa, la carretera y el entreno.',
    cta: (name: string) => `Comprar ${name}`,
    latest: 'Lanzamiento',
    photoAlt: 'Modelo con gafas deportivas Aztrals de lente transparente y jersey azul',
  },
  releases: {
    title: 'Encuentra tus Aztrals',
    text: 'Los lanzamientos de esta temporada. Escoge la forma y el color; la lente hace el resto.',
    all: 'Ver toda la colección',
  },
  spotlight: {
    lead: 'Nuevo',
    color: 'Color',
    add: 'Añadir a la bolsa',
    added: 'En tu bolsa',
    details: 'Ver detalles',
  },
  terms: ['Envío a todo Puerto Rico', 'Cambios dentro de 30 días', 'Pago seguro en Shopify'],
  pills: { words: ['Sol', 'Mar'], go: 'Ir a la tienda' },
  moments: {
    title: 'Hechas para cada momento',
    text: 'De la primera ola en Rincón al tapón de la tarde en San Juan: una gafa para cada parte del día.',
    wearing: 'Lleva',
    items: {
      playa: { t: 'Playa', d: 'Arena blanca y reflejo fuerte. Polarizada, siempre.' },
      surf: { t: 'Surf', d: 'Una lente que aguanta sal, agua y sol de mediodía.' },
      ciudad: { t: 'Ciudad', d: 'Del carro a la acera sin tener que quitártelas.' },
      entreno: { t: 'Entreno', d: 'Ligeras, con agarre y sin empañarse en la subida.' },
    },
  },
  collection: {
    title: 'Toda la colección',
    text: 'Cada modelo con su precio y sus colores. Ábrelo para ver los detalles o añádelo directo a la bolsa.',
    filters: { all: 'Todas', new: 'Nuevas', sport: 'Deportivas', polarized: 'Polarizadas' },
    filterLabel: 'Filtrar modelos',
    count: (n: number) => (n === 1 ? '1 modelo' : `${n} modelos`),
    none: 'Ningún modelo con ese filtro todavía.',
  },
  close: {
    title: 'Tu próxima vista empieza aquí',
    text: 'Todos los modelos y colores están en la tienda, listos para enviar.',
    cta: 'Ver la tienda',
  },
  footer: {
    line: 'Gafas de sol hechas para la luz de Puerto Rico.',
    store: 'Tienda en línea',
    instagram: 'Instagram',
    rights: 'Todos los derechos reservados.',
    credits: 'Intro: Skiper UI · Ilustraciones: Open Peeps',
  },
  shop: {
    title: 'Tienda',
    text: 'Todas las Aztrals en un solo lugar. Añade a la bolsa y termina tu compra en nuestra tienda Shopify.',
  },
  product: {
    color: 'Color',
    lens: 'Lente',
    frame: 'Marco',
    weight: 'Peso',
    protection: 'Protección',
    uv: 'UV400, bloquea el 100 % de los rayos UVA y UVB',
    buyStore: 'Comprar en la tienda',
    related: 'También te pueden gustar',
    back: 'Toda la colección',
    grams: (n: number) => `${n} g`,
  },
  card: { add: 'Añadir', added: 'Añadida', colors: (n: number) => `${n} colores`, newTag: 'Nueva' },
  bag: {
    title: 'Tu bolsa',
    close: 'Cerrar la bolsa',
    empty: 'Tu bolsa está vacía.',
    keep: 'Seguir viendo',
    subtotal: 'Subtotal',
    note: 'El envío y los impuestos se calculan al pagar en la tienda.',
    checkout: 'Pagar',
    checkoutStore: 'Terminar en la tienda',
    partial: 'Algunos modelos se terminan de comprar en su página de la tienda.',
    remove: 'Quitar',
    less: 'Quitar uno',
    more: 'Añadir uno',
    qty: 'Cantidad',
    open: (n: number) => (n === 1 ? 'Abrir la bolsa, 1 artículo' : `Abrir la bolsa, ${n} artículos`),
    buyOne: 'Comprar en la tienda',
  },
  notFound: { title: 'Esta página no existe', text: 'Puede que el modelo ya no esté disponible. La colección completa sigue aquí.', cta: 'Ver la tienda' },
};

export type Dict = typeof es;

const en: Dict = {
  locale: 'en-US',
  switchTo: 'Español',
  switchShort: 'ES',
  skip: 'Skip to content',
  intro: { enter: 'Enter', label: 'Welcome to Aztrals' },
  nav: { releases: 'New releases', moments: 'Moments', shop: 'Shop', bag: 'Bag', home: 'Aztrals, home' },
  meta: {
    homeTitle: 'Aztrals · Sunglasses from Puerto Rico',
    homeDescription: 'Polarized and sport sunglasses made for Puerto Rico light. See the new releases and buy on the Aztrals store.',
    shopTitle: 'Shop · Aztrals',
    shopDescription: 'Every Aztrals sunglasses model, with prices and colours. Buy online with shipping across Puerto Rico.',
  },
  hero: {
    title: 'See past the sun',
    text: 'Polarized sunglasses for the hard light of Puerto Rico: the beach, the road and the workout.',
    cta: (name: string) => `Buy ${name}`,
    latest: 'New release',
    photoAlt: 'Model wearing clear-lens Aztrals sport glasses and a blue jersey',
  },
  releases: {
    title: 'Find your Aztrals',
    text: "This season's releases. Pick the shape and the colour; the lens does the rest.",
    all: 'See the whole collection',
  },
  spotlight: {
    lead: 'New',
    color: 'Colour',
    add: 'Add to bag',
    added: 'In your bag',
    details: 'See details',
  },
  terms: ['Shipping across Puerto Rico', 'Exchanges within 30 days', 'Secure checkout on Shopify'],
  pills: { words: ['Sun', 'Sea'], go: 'Go to the shop' },
  moments: {
    title: 'Made for every moment',
    text: 'From the first wave in Rincón to afternoon traffic in San Juan: a pair for every part of the day.',
    wearing: 'Wearing',
    items: {
      playa: { t: 'Beach', d: 'White sand and hard glare. Polarized, always.' },
      surf: { t: 'Surf', d: 'A lens that handles salt, water and the midday sun.' },
      ciudad: { t: 'City', d: 'From the car to the sidewalk without taking them off.' },
      entreno: { t: 'Training', d: 'Light, with grip, and no fogging on the climb.' },
    },
  },
  collection: {
    title: 'The whole collection',
    text: 'Every model with its price and colours. Open one for the details or add it straight to your bag.',
    filters: { all: 'All', new: 'New', sport: 'Sport', polarized: 'Polarized' },
    filterLabel: 'Filter models',
    count: (n: number) => (n === 1 ? '1 model' : `${n} models`),
    none: 'No models match that filter yet.',
  },
  close: {
    title: 'Your next view starts here',
    text: 'Every model and colour is on the store, ready to ship.',
    cta: 'Visit the shop',
  },
  footer: {
    line: 'Sunglasses made for Puerto Rico light.',
    store: 'Online store',
    instagram: 'Instagram',
    rights: 'All rights reserved.',
    credits: 'Intro: Skiper UI · Illustrations: Open Peeps',
  },
  shop: {
    title: 'Shop',
    text: 'Every Aztrals in one place. Add to your bag and finish on our Shopify store.',
  },
  product: {
    color: 'Colour',
    lens: 'Lens',
    frame: 'Frame',
    weight: 'Weight',
    protection: 'Protection',
    uv: 'UV400, blocks 100% of UVA and UVB rays',
    buyStore: 'Buy on the store',
    related: 'You might also like',
    back: 'The whole collection',
    grams: (n: number) => `${n} g`,
  },
  card: { add: 'Add', added: 'Added', colors: (n: number) => `${n} colours`, newTag: 'New' },
  bag: {
    title: 'Your bag',
    close: 'Close the bag',
    empty: 'Your bag is empty.',
    keep: 'Keep browsing',
    subtotal: 'Subtotal',
    note: 'Shipping and taxes are calculated at checkout on the store.',
    checkout: 'Check out',
    checkoutStore: 'Finish on the store',
    partial: 'Some models are bought from their own page on the store.',
    remove: 'Remove',
    less: 'Remove one',
    more: 'Add one',
    qty: 'Quantity',
    open: (n: number) => (n === 1 ? 'Open the bag, 1 item' : `Open the bag, ${n} items`),
    buyOne: 'Buy on the store',
  },
  notFound: { title: 'This page does not exist', text: 'The model may no longer be available. The full collection is still here.', cta: 'Visit the shop' },
};

export const dict: Record<Lang, Dict> = { es, en };
export const t = (lang: Lang) => dict[lang];

export function formatPrice(amount: number, lang: Lang, currency = 'USD'): string {
  return new Intl.NumberFormat(dict[lang].locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 ? 2 : 0,
  }).format(amount);
}
