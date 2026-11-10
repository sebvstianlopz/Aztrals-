// Hero.
// - The headline rises line by line; the AZTRALS wordmark assembles letter by letter behind her.
// - On scroll the hero peels apart in layers: the headline lifts away fastest, the buy column a
//   little slower, the wordmark sinks, and she sinks slower than the page so her cropped base
//   never lifts into view.
import { gsap } from 'gsap';
import { riseLines, riseChars, splitChars } from './text';
import { q } from './util';

export function hero(wide: boolean) {
  const section = q('[data-hero]');
  const word = q('[data-hero-word]');
  const figure = q('[data-hero-figure]');
  const title = q('[data-hero-title]');
  const side = q('[data-hero-side]');
  if (!section || !word || !figure) return;

  if (title) riseLines(title, { delay: 0.1, onScroll: false });
  riseChars(splitChars(word), { delay: 0.15 });
  gsap.fromTo(figure, { y: 60, autoAlpha: 0, scale: 1.04 }, { y: 0, autoAlpha: 1, scale: 1, duration: 1.5, ease: 'expo.out', delay: 0.2 });

  const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: 0.6 } });
  tl.to(word, { yPercent: 34, ease: 'none' }, 0).to(figure, { y: wide ? 90 : 30, ease: 'none' }, 0);
  if (wide) {
    if (title) tl.to(title, { y: -160, ease: 'none' }, 0);
    if (side) tl.to(side, { y: -90, ease: 'none' }, 0);
  }
}
