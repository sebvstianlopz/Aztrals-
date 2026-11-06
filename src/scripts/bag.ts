// The bag: what the visitor has picked, kept in this browser only.
// Opens as a drawer; "send" turns it into one WhatsApp message.
import type { Lang } from '../config/site';
import type { ClientProduct } from '../lib/products';
import { orderMessage, waLink } from '../lib/whatsapp';

export interface Line { slug: string; variant: string; qty: number }

const KEY = 'aztrals:bag';
let memory: Line[] = [];

export function read(): Line[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) memory = JSON.parse(raw);
  } catch { /* storage blocked: keep the bag in memory for this page */ }
  return memory.filter((l) => l && l.slug && l.variant && l.qty > 0);
}

function write(lines: Line[]) {
  memory = lines;
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* see read() */ }
  document.dispatchEvent(new CustomEvent('bag:change'));
}

export function add(slug: string, variant: string, qty = 1) {
  const lines = read();
  const l = lines.find((x) => x.slug === slug && x.variant === variant);
  if (l) l.qty = Math.min(20, l.qty + qty);
  else lines.push({ slug, variant, qty });
  write(lines);
}

export function setQty(slug: string, variant: string, qty: number) {
  write(read().map((l) => (l.slug === slug && l.variant === variant ? { ...l, qty: Math.min(20, qty) } : l)).filter((l) => l.qty > 0));
}

export const count = () => read().reduce((s, l) => s + l.qty, 0);

const json = <T>(id: string): T => JSON.parse(document.getElementById(id)?.textContent || 'null');

export function catalog(): ClientProduct[] {
  return json<ClientProduct[]>('catalog') ?? [];
}

const money = (n: number, lang: Lang) =>
  new Intl.NumberFormat(lang === 'es' ? 'es-PR' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export function openBag() {
  const d = document.getElementById('bag') as HTMLDialogElement | null;
  if (!d) return;
  render();
  if (!d.open) d.showModal();
}

function render() {
  const d = document.getElementById('bag') as HTMLDialogElement | null;
  if (!d) return;
  const lang = (document.documentElement.dataset.lang || 'es') as Lang;
  const text = json<Record<string, string>>('bag-text');
  const items = catalog();
  const lines = read()
    .map((l) => {
      const p = items.find((x) => x.slug === l.slug);
      const v = p?.variants.find((x) => x.id === l.variant);
      return p && v ? { l, p, v } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  const list = d.querySelector<HTMLElement>('[data-bag-lines]')!;
  const empty = d.querySelector<HTMLElement>('[data-bag-empty]')!;
  const foot = d.querySelector<HTMLElement>('[data-bag-foot]')!;
  empty.hidden = lines.length > 0;
  foot.hidden = lines.length === 0;
  list.replaceChildren(
    ...lines.map(({ l, p, v }) => {
      const li = document.createElement('li');
      li.className = 'bag-line';
      li.style.setProperty('--field', v.field);
      li.innerHTML = `
        <a class="bag-pic" href="${p.url[lang]}?v=${v.id}"><img src="${v.poster}" alt="" width="160" height="120" loading="lazy" /></a>
        <div class="bag-info">
          <a class="bag-name" href="${p.url[lang]}?v=${v.id}">${p.name}</a>
          <span class="soft small">${v.name[lang]}</span>
          <span class="bag-qty">
            <button type="button" data-q="-1" aria-label="${text.less}">−</button>
            <output class="num" aria-live="polite">${l.qty}</output>
            <button type="button" data-q="1" aria-label="${text.more}">+</button>
            <button type="button" class="bag-remove small" data-q="x">${text.remove}</button>
          </span>
        </div>
        <span class="bag-price num">${money(p.price * l.qty, lang)}</span>`;
      li.querySelectorAll<HTMLButtonElement>('button[data-q]').forEach((b) =>
        b.addEventListener('click', () => {
          const q = b.dataset.q === 'x' ? 0 : l.qty + Number(b.dataset.q);
          setQty(l.slug, l.variant, q);
          render();
          if (q === 0) (d.querySelector('[data-bag-close]') as HTMLElement)?.focus();
        }),
      );
      return li;
    }),
  );
  const total = lines.reduce((s, { l, p }) => s + l.qty * p.price, 0);
  d.querySelector('[data-bag-total]')!.textContent = money(total, lang);
  const send = d.querySelector<HTMLAnchorElement>('[data-bag-send]')!;
  send.href = waLink(orderMessage(lines.map(({ l, p, v }) => ({ name: p.name, variant: v.name[lang], qty: l.qty, price: p.price })), lang));
}

function syncCount() {
  const n = count();
  document.querySelectorAll<HTMLElement>('[data-bag-count]').forEach((el) => (el.textContent = n ? String(n) : ''));
  document.documentElement.classList.toggle('has-bag', n > 0);
}

export function initBag() {
  const d = document.getElementById('bag') as HTMLDialogElement | null;
  document.querySelectorAll('[data-bag-open]').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.preventDefault();
      openBag();
    }),
  );
  d?.querySelector('[data-bag-close]')?.addEventListener('click', () => d.close());
  d?.addEventListener('click', (e) => {
    if (e.target === d) d.close(); // a click on the backdrop
  });
  document.addEventListener('click', (e) => {
    const b = (e.target as Element | null)?.closest<HTMLButtonElement>('[data-add]');
    if (!b) return;
    const [slug, variant] = (b.dataset.add || '').split('|');
    if (!slug || !variant) return;
    const qtyEl = b.dataset.qty ? document.querySelector<HTMLInputElement>(b.dataset.qty) : null;
    const qty = Math.max(1, Math.min(20, Number(qtyEl?.value) || 1));
    add(slug, variant, qty);
    if (b.dataset.added) {
      const label = b.textContent;
      b.textContent = b.dataset.added;
      setTimeout(() => (b.textContent = label), 1600);
    }
    openBag();
  });
  document.addEventListener('bag:change', syncCount);
  addEventListener('storage', (e) => e.key === KEY && syncCount());
  syncCount();
}
