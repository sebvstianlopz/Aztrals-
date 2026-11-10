// "Momentos": the portraits settle from a slight zoom as they cross the screen.
import { gsap } from 'gsap';
import { qa } from './util';

export function moments() {
  qa('.moment .shot__draw, .moment picture').forEach((el) => {
    gsap.fromTo(el, { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'center 45%', scrub: 0.6 } });
  });
  // Until phase 2 replaces them, the moment cards and heading use the plain entrance.
  qa('[data-moment], [data-moments-title]').forEach((el) =>
    gsap.from(el, { autoAlpha: 0, y: 28, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }),
  );
}
