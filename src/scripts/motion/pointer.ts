// Mouse/trackpad-only touches.
// - Magnetic buttons: [data-magnetic] buttons lean toward the cursor and spring back when it leaves.
// - Hero depth: moving the mouse shifts the model and the wordmark a few pixels in opposite
//   directions, with a soft delay, so the hero feels three-dimensional.
import { gsap } from 'gsap';
import { q, qa } from './util';

export function pointer() {
  const off: Array<() => void> = [];
  const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
    el.addEventListener(type, fn);
    off.push(() => el.removeEventListener(type, fn));
  };

  qa('[data-magnetic]').forEach((btn) => {
    const x = gsap.quickTo(btn, 'x', { duration: 0.45, ease: 'power3.out' });
    const y = gsap.quickTo(btn, 'y', { duration: 0.45, ease: 'power3.out' });
    on(btn, 'pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * 0.28);
      y((e.clientY - (r.top + r.height / 2)) * 0.4);
    });
    on(btn, 'pointerleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' }));
  });

  const hero = q('[data-hero]');
  const figure = q('[data-hero-figure]');
  const word = q('[data-hero-word]');
  if (hero && figure && word) {
    const fx = gsap.quickTo(figure, 'x', { duration: 1.1, ease: 'power3.out' });
    const wx = gsap.quickTo(word, 'x', { duration: 1.3, ease: 'power3.out' });
    on(hero, 'pointermove', (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      fx(nx * -18);
      wx(nx * 28);
    });
    on(hero, 'pointerleave', () => {
      fx(0);
      wx(0);
    });
  }
  return () => off.forEach((fn) => fn());
}
