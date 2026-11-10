// Hero.
// - Typing, in order: first the headline "Ve más allá del sol" types out with a blinking caret, then
//   the caret jumps to the AZTRALS name in front of her, which types out letter by letter.
// - On scroll she stays behind the name, sinking a little slower than the page (so her cropped base
//   never lifts into view) while the name holds its place; the headline and buy column lift away
//   in layers.
import { gsap } from 'gsap';
import { typeOn } from './text';
import { q } from './util';

export function hero(wide: boolean) {
  const section = q('[data-hero]');
  const word = q('[data-hero-word]');
  const figure = q('[data-hero-figure]');
  const title = q('[data-hero-title]');
  const side = q('[data-hero-side]');
  if (!section || !word || !figure) return;

  const typing = gsap.timeline({ delay: 0.3 });
  const headline = title ? typeOn(title, { speed: 0.07 }) : null;
  if (headline) typing.add(headline).add(() => headline.removeCaret(), '+=0.35');
  const name = typeOn(word, { speed: 0.13, wordPause: 0 });
  typing.add(name, headline ? '+=0.15' : 0).add(() => name.removeCaret(), '+=1.6');

  gsap.fromTo(figure, { y: 60, autoAlpha: 0, scale: 1.04 }, { y: 0, autoAlpha: 1, scale: 1, duration: 1.5, ease: 'expo.out', delay: 0.2 });

  const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: 0.6 } });
  tl.to(figure, { y: wide ? 90 : 30, ease: 'none' }, 0);
  if (wide) {
    if (title) tl.to(title, { y: -160, ease: 'none' }, 0);
    if (side) tl.to(side, { y: -90, ease: 'none' }, 0);
  }
}
