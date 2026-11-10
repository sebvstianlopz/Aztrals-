// The motion layer. GSAP + ScrollTrigger, only when the visitor has not asked for reduced motion.
// Every element starts visible in the HTML; hidden start states are set here, so if this script
// never runs, nothing stays hidden.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const root = document.documentElement;

if (root.classList.contains('motion')) {
  gsap.registerPlugin(ScrollTrigger);
  // While the intro screen is up, hold every entrance until it lifts, so the hero plays as the
  // page is revealed instead of behind the intro.
  if (root.classList.contains('intro-on')) window.addEventListener('aztrals:intro-done', start, { once: true });
  else start();}

function start() {
  const mm = gsap.matchMedia();

  mm.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      wide: '(min-width: 901px)',
    },
    (ctx) => {
      const { motion, wide } = ctx.conditions as { motion: boolean; wide: boolean };
      if (!motion) return;

      // ---------- entrances: heading, then text, then picture, staggered ----------
      const enter = (selector: string, stagger: number) => {
        const els = gsap.utils.toArray<HTMLElement>(selector);
        gsap.set(els, { autoAlpha: 0, y: 28 });
        ScrollTrigger.batch(els, {
          start: 'top 90%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger, overwrite: true }),
        });
      };
      enter('[data-reveal]', 0.08);
      enter('[data-stagger] > *', 0.07);

      // ---------- hero: the figure settles in, the wordmark rises behind it ----------
      const word = document.querySelector('[data-hero-word]');
      const figure = document.querySelector<HTMLElement>('[data-hero-figure]');
      if (word && figure) {
        gsap.fromTo(word, { yPercent: 28, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.4, ease: 'expo.out', delay: 0.1 });
        const scroll = gsap.timeline({
          scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: 0.6 },
        });
        scroll.to(word, { yPercent: 34, ease: 'none' }, 0);

        gsap.fromTo(
          figure,
          { y: 60, autoAlpha: 0, scale: 1.04 },
          { y: 0, autoAlpha: 1, scale: 1, duration: 1.5, ease: 'expo.out', delay: 0.2 },
        );
        // The figure sinks a little slower than the page, so its cropped base never lifts into view.
        scroll.to(figure, { y: wide ? 90 : 30, ease: 'none' }, 0);
      }

      // ---------- spotlight: pinned; the sun rises behind the model as it turns ----------
      const spot = document.querySelector<HTMLElement>('[data-spot]');
      if (spot) {
        const pin = spot.querySelector<HTMLElement>('[data-spot-pin]');
        const sun = spot.querySelector<HTMLElement>('[data-spot-sun]');
        const drawn = spot.querySelectorAll<HTMLElement>('[data-drawn]');
        const angle1 = spot.querySelectorAll<HTMLElement>('[data-angle="1"]');
        const angle2 = spot.querySelectorAll<HTMLElement>('[data-angle="2"]');
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
      }

      // ---------- pill row: the words slide together as it scrolls in ----------
      const pills = gsap.utils.toArray<HTMLElement>('[data-pill]');
      if (pills.length) {
        const offsets = [-60, -30, 30, 60];
        gsap
          .timeline({ scrollTrigger: { trigger: '[data-pills]', start: 'top 95%', end: 'top 45%', scrub: 0.6 } })
          .from(pills, { xPercent: (i) => offsets[i % 4], scale: 0.9, autoAlpha: 0.2, ease: 'none', stagger: 0.04 });
      }

      // ---------- pictures: settle from a slight zoom as they cross the screen ----------
      gsap.utils.toArray<HTMLElement>('.moment .shot__draw, .moment picture').forEach((el) => {
        gsap.fromTo(
          el,
          { scale: 1.14 },
          { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'center 45%', scrub: 0.6 } },
        );
      });
    },
  );
}
