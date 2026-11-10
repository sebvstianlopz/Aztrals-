// The visor: as the dark release section comes up, a Smoky panel lowers over the page from the
// top, tied to the scroll, like putting sunglasses on. The dark section slides up in front of it;
// when its top reaches the top of the screen the two meet and the view is fully "tinted".
import { gsap } from 'gsap';
import { q } from './util';

export function visor() {
  const panel = q('[data-visor]');
  const spot = q('[data-spot]');
  if (!panel || !spot) return;
  gsap.fromTo(
    panel,
    { y: 0, yPercent: -101 },
    {
      y: 0,
      yPercent: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: spot,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        // Once the dark section covers the screen the panel steps aside, so it never sits over the
        // sections that follow; scrolling back brings it back.
        onLeave: () => gsap.set(panel, { autoAlpha: 0 }),
        onEnterBack: () => gsap.set(panel, { autoAlpha: 1 }),
      },
    },
  );
}
