// Interaction effects used by the bag, the colour pickers and the filters.
// Each one does its job instantly when the visitor prefers reduced motion.
import { gsap } from 'gsap';

export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Sends a copy of the product picture on a curved path to the bag counter in the header (or to the
 * top-right corner, where the bag opens, when the header is scrolled away). Resolves on landing.
 */
export function flyToBag(source: Element | null): Promise<void> {
  if (!source || reduced()) return Promise.resolve();
  const from = source.getBoundingClientRect();
  if (!from.width || !from.height) return Promise.resolve();
  const counter = document.querySelector('.bar__count')?.getBoundingClientRect();
  const visible = counter && counter.bottom > 0 && counter.top < window.innerHeight;
  const to = visible
    ? { x: counter.left + counter.width / 2, y: counter.top + counter.height / 2 }
    : { x: window.innerWidth - 56, y: 40 };

  const ghost = source.cloneNode(true) as HTMLElement;
  ghost.removeAttribute('id');
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: '0',
    zIndex: '150',
    pointerEvents: 'none',
    transition: 'none',
  });
  document.body.append(ghost);

  const dx = to.x - (from.left + from.width / 2);
  const dy = to.y - (from.top + from.height / 2);
  const scale = Math.min(1, Math.max(0.06, 44 / from.width));
  return new Promise((resolve) => {
    gsap
      .timeline({ onComplete: () => (ghost.remove(), resolve()) })
      .to(ghost, { x: dx, duration: 0.8, ease: 'power2.inOut' }, 0)
      .to(ghost, { y: dy, duration: 0.8, ease: 'back.in(1.4)' }, 0)
      .to(ghost, { scale, duration: 0.8, ease: 'power2.in' }, 0)
      .to(ghost, { autoAlpha: 0, duration: 0.18, ease: 'power1.in' }, 0.64);
  });
}

/**
 * Turns the given layers half a turn, runs `swap` while they are edge-on (with a slight blur so the
 * change reads as one object), and turns them back: used when a colour is picked.
 */
export function flipSwap(layers: HTMLElement[], scope: HTMLElement, swap: () => void) {
  if (!layers.length || reduced()) return swap();
  gsap.killTweensOf(layers);
  scope.setAttribute('data-flipping', '');
  gsap
    .timeline({ onComplete: () => scope.removeAttribute('data-flipping') })
    .to(layers, { rotateY: 90, filter: 'blur(3px)', duration: 0.2, ease: 'power2.in', transformPerspective: 1000 })
    .add(swap)
    .fromTo(layers, { rotateY: -90 }, { rotateY: 0, filter: 'blur(0px)', duration: 0.38, ease: 'power3.out', clearProps: 'filter' });
}

/** Rolls a number shown in `el` from one value to another, formatting each frame. */
export function rollNumber(el: HTMLElement, from: number, to: number, format: (n: number) => string, duration = 0.5) {
  if (reduced() || from === to) {
    el.textContent = format(to);
    return;
  }
  const o = { n: from };
  gsap.killTweensOf(o);
  gsap.to(o, {
    n: to,
    duration,
    ease: 'power3.out',
    onUpdate: () => (el.textContent = format(Math.round(o.n))),
    onComplete: () => (el.textContent = format(to)),
  });
}

/** Fades and slides an element out, then collapses its height, then calls `done`. */
export function collapseOut(el: HTMLElement, done: () => void) {
  if (reduced()) return done();
  gsap
    .timeline({ onComplete: done })
    .to(el, { autoAlpha: 0, x: 24, duration: 0.22, ease: 'power2.in' })
    .to(el, { height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0, duration: 0.26, ease: 'power2.inOut' });
}
