// Release spotlight: pinned on desktop; the Bone disc (the sun) rises behind the glasses as they
// turn. The copy fades in.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { riseChars, splitChars } from './text';
import { q, qa } from './util';

export function spotlight(wide: boolean) {
  const spot = q('[data-spot]');
  if (!spot) return;
  const pin = q('[data-spot-pin]', spot);
  const sun = q('[data-spot-sun]', spot);
  const drawn = qa('[data-drawn]', spot);
  const angle1 = qa('[data-angle="1"]', spot);
  const angle2 = qa('[data-angle="2"]', spot);

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: wide
      ? { trigger: pin, start: 'top top', end: '+=100%', pin: true, scrub: 0.8, anticipatePin: 1 }
      : { trigger: spot, start: 'top 80%', end: 'bottom 40%', scrub: 0.8 },
  });
  tl.fromTo(sun, { yPercent: 38, scale: 0.78 }, { yPercent: -6, scale: 1 }, 0);
  if (drawn.length) {
    gsap.set(drawn, { transformPerspective: 1100 });
    tl.fromTo(drawn, { rotateY: -28, rotateX: 6, scale: 0.86 }, { rotateY: 0, rotateX: 0, scale: 1, duration: 0.55 }, 0).to(
      drawn,
      { rotateY: 16, scale: 1.04, duration: 0.45 },
      0.55,
    );
  }
  if (angle1.length) tl.to(angle1, { opacity: 1, duration: 0.2 }, 0.3);
  if (angle2.length) tl.to(angle2, { opacity: 1, duration: 0.2 }, 0.65);

  // The copy arrives in order as the section settles: "RINCÓN" letter by letter, then the tagline,
  // description, specs and colours line by line, and the price and button last, where the eye lands.
  const copy = q('[data-spot-copy]', spot);
  const name = q('[data-spot-name]', spot);
  const lines = qa('[data-spot-line]', spot);
  if (copy && name) {
    const chars = splitChars(name);
    gsap.set(lines, { autoAlpha: 0, y: 24 });
    ScrollTrigger.create({
      trigger: spot,
      start: wide ? 'top 30%' : 'top 70%',
      once: true,
      onEnter: () => {
        riseChars(chars, { duration: 1.1, stagger: 0.045 });
        gsap.to(lines, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1, delay: 0.35 });
      },
    });
  }

  // The three shipping lines appear one after another.
  const terms = qa('[data-spot-terms] li', spot);
  if (terms.length)
    gsap.from(terms, { autoAlpha: 0, y: 12, duration: 0.7, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: terms[0], start: 'top 95%', once: true } });
}
