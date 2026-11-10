// Hero: the headline rises line by line, the figure settles in, the wordmark rises behind her;
// on scroll she sinks slower than the page so her cropped base never lifts into view.
import { gsap } from 'gsap';
import { riseLines } from './text';
import { q } from './util';

export function hero(wide: boolean) {
  const section = q('[data-hero]');
  const word = q('[data-hero-word]');
  const figure = q('[data-hero-figure]');
  const title = q('[data-hero-title]');
  if (!section || !word || !figure) return;

  if (title) riseLines(title, { delay: 0.1, onScroll: false });
  gsap.fromTo(word, { yPercent: 28, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.4, ease: 'expo.out', delay: 0.1 });
  gsap.fromTo(figure, { y: 60, autoAlpha: 0, scale: 1.04 }, { y: 0, autoAlpha: 1, scale: 1, duration: 1.5, ease: 'expo.out', delay: 0.2 });

  gsap
    .timeline({ scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: 0.6 } })
    .to(word, { yPercent: 34, ease: 'none' }, 0)
    .to(figure, { y: wide ? 90 : 30, ease: 'none' }, 0);
}
