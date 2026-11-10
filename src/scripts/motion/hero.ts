// Hero.
// - The headline rises line by line; the AZTRALS wordmark assembles letter by letter in front of her.
// - On scroll the model disappears behind the name while the name stays: on desktop the hero holds
//   in place for a short stretch while she sinks and fades out; on phones she fades as the hero
//   scrolls away. The headline and buy column lift away in layers.
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

  if (wide) {
    // Hold the hero for 80% of a screen while she leaves; the name stays where it is.
    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top top', end: '+=80%', pin: true, scrub: 0.6, anticipatePin: 1 },
    });
    tl.to(figure, { y: 140, scale: 0.94, autoAlpha: 0, ease: 'power1.in' }, 0);
    if (title) tl.to(title, { y: -40, ease: 'none' }, 0);
    if (side) tl.to(side, { y: -24, ease: 'none' }, 0);
  } else {
    gsap.to(figure, { y: 40, autoAlpha: 0, ease: 'power1.in', scrollTrigger: { trigger: figure, start: 'center 45%', end: 'bottom 20%', scrub: 0.6 } });
  }
}
