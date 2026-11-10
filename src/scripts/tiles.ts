// Product tiles: the colour dots choose (click) or preview (hover) a colourway, and on a mouse the
// glasses tilt toward the pointer.
import { gsap } from 'gsap';
import { reduced } from '../lib/fx';

const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

document.querySelectorAll<HTMLElement>('[data-tile]').forEach((tile) => {
  const layers = [...tile.querySelectorAll<HTMLElement>('[data-tile-layer]')];
  const dots = [...tile.querySelectorAll<HTMLButtonElement>('[data-tile-dot]')];
  const add = tile.querySelector<HTMLButtonElement>('[data-add]');
  const srName = tile.querySelector<HTMLElement>('[data-tile-cwname]');
  const name = tile.querySelector('.tile__name')?.textContent?.trim() ?? '';
  let selected = dots.find((d) => d.getAttribute('aria-pressed') === 'true')?.dataset.tileDot ?? layers[0]?.dataset.tileLayer;

  const show = (id?: string) => layers.forEach((l) => l.toggleAttribute('data-active', l.dataset.tileLayer === id));

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      selected = dot.dataset.tileDot;
      dots.forEach((d) => d.setAttribute('aria-pressed', String(d === dot)));
      show(selected);
      if (add && selected) add.dataset.colorway = selected;
      if (srName) srName.textContent = ` ${name}, ${dot.dataset.name ?? ''}`;
    });
    if (finePointer) dot.addEventListener('pointerenter', () => show(dot.dataset.tileDot));
  });
  if (finePointer) dots[0]?.parentElement?.addEventListener('pointerleave', () => show(selected));

  // Tilt toward the pointer (mouse/trackpad, motion allowed).
  const media = tile.querySelector<HTMLElement>('[data-tile-media]');
  const wrap = tile.querySelector<HTMLElement>('[data-tile-layers]');
  if (!finePointer || reduced() || !media || !wrap) return;
  gsap.set(wrap, { transformPerspective: 900 });
  const rx = gsap.quickTo(wrap, 'rotationX', { duration: 0.6, ease: 'power3.out' });
  const ry = gsap.quickTo(wrap, 'rotationY', { duration: 0.6, ease: 'power3.out' });
  media.addEventListener('pointermove', (e) => {
    const r = media.getBoundingClientRect();
    rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
    ry(((e.clientX - r.left) / r.width - 0.5) * 14);
  });
  media.addEventListener('pointerleave', () => {
    rx(0);
    ry(0);
  });
});
