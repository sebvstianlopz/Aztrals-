// Collection filters and colour pickers. Both work without motion; with motion the remaining tiles
// glide into their new places (GSAP Flip), the count rolls, and picking a colour flips the glasses.
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { flipSwap, reduced, rollNumber } from '../lib/fx';

gsap.registerPlugin(Flip);

// ---------- filters ----------
document.querySelectorAll<HTMLElement>('[data-filter-scope]').forEach((scope) => {
  const buttons = [...scope.querySelectorAll<HTMLButtonElement>('[data-filter]')];
  const tiles = [...scope.querySelectorAll<HTMLElement>('[data-tile]')];
  const count = scope.querySelector<HTMLElement>('[data-filter-count]');
  const none = scope.querySelector<HTMLElement>('[data-filter-none]');
  const label = (n: number) => (n === 1 ? count?.dataset.one || '' : (count?.dataset.many || '').replace('{n}', String(n)));
  let shownBefore = tiles.length;

  const grid = tiles[0]?.parentElement;

  function apply(key: string) {
    const animate = !reduced();
    const state = animate ? Flip.getState(tiles) : null;
    const before = grid?.offsetHeight ?? 0;
    let shown = 0;
    tiles.forEach((tile) => {
      const match = key === 'all' || tile.hasAttribute(`data-${key}`);
      tile.hidden = !match;
      if (match) shown++;
    });
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === key)));
    if (count) rollNumber(count, shownBefore, shown, label, 0.45);
    shownBefore = shown;
    if (none) none.hidden = shown > 0;
    if (state) {
      // While tiles glide (positioned absolutely), hold the grid's height and ease it to the new
      // one, so the page below doesn't jump up behind them.
      const after = grid?.offsetHeight ?? 0;
      if (grid) gsap.fromTo(grid, { minHeight: before }, { minHeight: after, duration: 0.65, ease: 'power3.inOut', clearProps: 'minHeight' });
      Flip.from(state, {
        duration: 0.65,
        ease: 'power3.inOut',
        absolute: true,
        onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out', delay: 0.12 }),
        onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.92, duration: 0.3, ease: 'power2.in' }),
      });
    }
  }

  buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.filter || 'all')));
});

// ---------- colour pickers (spotlight and product page) ----------
document.addEventListener('change', (e) => {
  const input = e.target as HTMLInputElement;
  if (!input.matches('[data-cw-input]')) return;
  const scope = input.closest<HTMLElement>('[data-spot], [data-cw-scope]');
  if (!scope) return;
  const layers = [...scope.querySelectorAll<HTMLElement>('[data-cw]')];
  flipSwap(layers, scope, () => layers.forEach((layer) => layer.toggleAttribute('data-active', layer.dataset.cw === input.value)));
  scope.querySelectorAll<HTMLElement>('[data-cw-name]').forEach((el) => (el.textContent = input.dataset.name || ''));
  scope.querySelectorAll<HTMLElement>('[data-add]').forEach((btn) => (btn.dataset.colorway = input.value));
});
