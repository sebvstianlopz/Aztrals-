// "Toda la colección" (home and shop): the grid fills in as a ripple from the top-left corner.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { qa } from './util';

export function collection() {
  qa('[data-grid]').forEach((grid) => {
    const tiles = Array.from(grid.children) as HTMLElement[];
    gsap.set(tiles, { autoAlpha: 0, y: 32 });
    ScrollTrigger.create({
      trigger: grid,
      start: 'top 85%',
      once: true,
      onEnter: () =>
        gsap.to(tiles, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: { each: 0.08, grid: 'auto', from: 'start' }, clearProps: 'transform' }),
    });
  });
}
