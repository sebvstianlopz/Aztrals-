// The quiet default entrance for everything else: fade and rise, staggered, once.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function reveals() {
  const enter = (selector: string, stagger: number) => {
    const els = gsap.utils.toArray<HTMLElement>(selector);
    if (!els.length) return;
    gsap.set(els, { autoAlpha: 0, y: 28 });
    ScrollTrigger.batch(els, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger, overwrite: true }),
    });
  };
  enter('[data-reveal]', 0.08);
  enter('[data-stagger] > *', 0.07);
  // Interim: the elements later phases animate in their own way still need to appear.
  enter('[data-grid] > *, [data-foot-word], [data-close-title]', 0.07);
}
