// The bag: a small store kept in localStorage, the drawer, and every "add" button on the page.
import { checkoutUrl, lineProductUrl, money, type Catalog, type Line } from '../lib/checkout';

const KEY = 'aztrals:bag:v1';
const catalogEl = document.getElementById('catalog');
const catalog: Catalog | null = catalogEl ? JSON.parse(catalogEl.textContent || '{}') : null;
const drawer = document.querySelector<HTMLElement>('[data-bag]');

function read(): Line[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw)
      ? raw.filter((l) => l && typeof l.s === 'string' && typeof l.c === 'string' && l.q > 0 && catalog?.products[l.s]?.colorways[l.c])
      : [];
  } catch {
    return [];
  }
}

let lines: Line[] = read();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* private mode: the bag still works for this page view */
  }
}

const count = () => lines.reduce((n, l) => n + l.q, 0);

function add(s: string, c: string) {
  const found = lines.find((l) => l.s === s && l.c === c);
  if (found) found.q = Math.min(found.q + 1, 9);
  else lines.push({ s, c, q: 1 });
  save();
  render(true);
}

function setQty(i: number, q: number) {
  if (q <= 0) lines.splice(i, 1);
  else lines[i].q = Math.min(q, 9);
  save();
  render();
}

// ---------- rendering ----------
const strings = drawer?.dataset;

function render(bump = false) {
  const n = count();
  document.querySelectorAll<HTMLElement>('[data-bag-count]').forEach((el) => {
    el.textContent = String(n);
    if (bump && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], {
        duration: 320,
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      });
    }
  });
  document.querySelectorAll<HTMLElement>('[data-bag-open]').forEach((el) => {
    const label = n === 1 ? el.dataset.labelOne : (el.dataset.labelMany || '').replace('{n}', String(n));
    if (label) el.setAttribute('aria-label', label);
  });
  if (!drawer || !catalog) return;

  const list = drawer.querySelector<HTMLElement>('[data-bag-list]')!;
  const empty = drawer.querySelector<HTMLElement>('[data-bag-empty]')!;
  const foot = drawer.querySelector<HTMLElement>('[data-bag-foot]')!;
  const tpl = drawer.querySelector<HTMLTemplateElement>('[data-bag-line]')!;
  list.replaceChildren();
  empty.hidden = n > 0;
  foot.hidden = n === 0;

  let subtotal = 0;
  lines.forEach((line, i) => {
    const p = catalog.products[line.s];
    const cw = p.colorways[line.c];
    subtotal += p.price * line.q;
    const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
    node.querySelector<HTMLElement>('[data-f]')!.style.background = cw.frame;
    node.querySelector<HTMLElement>('[data-t]')!.style.background = cw.tint;
    const name = node.querySelector<HTMLAnchorElement>('[data-name]')!;
    name.textContent = p.name;
    name.href = p.url;
    node.querySelector('[data-color]')!.textContent = cw.name;
    node.querySelector('[data-price]')!.textContent = money(p.price * line.q, catalog);
    node.querySelector('[data-q]')!.textContent = String(line.q);
    node.querySelector('[data-less]')!.addEventListener('click', () => setQty(i, line.q - 1));
    node.querySelector('[data-more]')!.addEventListener('click', () => setQty(i, line.q + 1));
    node.querySelector('[data-remove]')!.addEventListener('click', () => setQty(i, 0));
    const buy = node.querySelector<HTMLAnchorElement>('[data-buy]')!;
    if (cw.variant) buy.remove();
    else buy.href = lineProductUrl(line, catalog);
    list.append(node);
  });

  drawer.querySelector('[data-bag-subtotal]')!.textContent = money(subtotal, catalog);
  const go = drawer.querySelector<HTMLAnchorElement>('[data-bag-checkout]')!;
  const { url, direct } = checkoutUrl(lines, catalog);
  go.href = url;
  go.querySelector('span')!.textContent = (direct ? strings?.checkout : strings?.checkoutStore) || '';
  drawer.querySelector<HTMLElement>('[data-bag-partial]')!.hidden = direct || n === 0;
}

// ---------- drawer ----------
let lastFocus: HTMLElement | null = null;
const page = () => document.querySelectorAll<HTMLElement>('[data-inert-with-bag]');

function open() {
  if (!drawer || drawer.dataset.open === 'true') return;
  lastFocus = document.activeElement as HTMLElement;
  drawer.hidden = false;
  // next frame so the transition runs from the closed position
  requestAnimationFrame(() => {
    drawer.dataset.open = 'true';
    drawer.querySelector<HTMLElement>('[data-bag-close]')?.focus({ preventScroll: true });
  });
  page().forEach((el) => (el.inert = true));
  document.documentElement.classList.add('bag-open');
}

function close() {
  if (!drawer || drawer.dataset.open !== 'true') return;
  drawer.dataset.open = 'false';
  page().forEach((el) => (el.inert = false));
  document.documentElement.classList.remove('bag-open');
  const panel = drawer.querySelector('.bag__panel');
  const done = () => {
    if (drawer.dataset.open === 'false') drawer.hidden = true;
  };
  panel?.addEventListener('transitionend', done, { once: true });
  setTimeout(done, 400);
  lastFocus?.focus({ preventScroll: true });
}

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const opener = target.closest('[data-bag-open]');
  if (opener) {
    e.preventDefault();
    open();
    return;
  }
  if (target.closest('[data-bag-close]')) {
    close();
    return;
  }
  const btn = target.closest<HTMLButtonElement>('[data-add]');
  if (btn) {
    const s = btn.dataset.add!;
    let c = btn.dataset.colorway || '';
    const group = btn.dataset.colorwayFrom;
    if (group) c = document.querySelector<HTMLInputElement>(`input[name="${group}"]:checked`)?.value || c;
    if (!catalog?.products[s]?.colorways[c]) return;
    add(s, c);
    confirm(btn);
    open();
  }
});

function confirm(btn: HTMLButtonElement) {
  const label = btn.querySelector<HTMLElement>('[data-label]');
  if (!label || !btn.dataset.added) return;
  const original = label.dataset.original || label.textContent || '';
  label.dataset.original = original;
  btn.dataset.state = 'added';
  label.textContent = btn.dataset.added;
  clearTimeout(Number(btn.dataset.timer));
  btn.dataset.timer = String(
    setTimeout(() => {
      btn.dataset.state = '';
      label.textContent = original;
    }, 1600),
  );
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') close();
  if (e.key === 'Tab' && drawer?.dataset.open === 'true') {
    const focusables = [...drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')].filter(
      (el) => el.offsetParent !== null,
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    lines = read();
    render();
  }
});

render();
