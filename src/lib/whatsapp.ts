// The one place every "buy" button gets its WhatsApp link from.
// Runs at build time (links that work without JavaScript) and in the browser (the bag).
import { site, type Lang } from '../config/site';

export interface OrderLine {
  name: string;
  variant: string;
  qty: number;
  price: number;
}

const usd = (n: number, lang: Lang) =>
  new Intl.NumberFormat(lang === 'es' ? 'es-PR' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const words = {
  es: { hi: 'Hola, Aztrals.', order: 'Quisiera hacer este pedido:', total: 'Total', ask: '¿Está disponible? Gracias.', one: 'Me interesa el' , in: 'en' },
  en: { hi: 'Hi, Aztrals.', order: 'I’d like to place this order:', total: 'Total', ask: 'Is it available? Thank you.', one: 'I’m interested in the', in: 'in' },
};

export function orderMessage(lines: OrderLine[], lang: Lang): string {
  const w = words[lang];
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
  return [
    w.hi,
    w.order,
    ...lines.map((l) => `• ${l.qty} × ${l.name} — ${l.variant} — ${usd(l.price * l.qty, lang)}`),
    `${w.total}: ${usd(total, lang)}`,
    w.ask,
  ].join('\n');
}

export function singleMessage(name: string, variant: string, price: number, url: string, lang: Lang): string {
  const w = words[lang];
  return [w.hi, `${w.one} ${name} ${w.in} ${variant} (${usd(price, lang)}). ${w.ask}`, url].join('\n');
}

export const waLink = (text: string) => `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
