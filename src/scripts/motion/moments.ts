// "Hechas para cada momento".
// - The sticky heading's last words follow the picture in view on desktop:
//   "cada momento" → "la playa" → "el surf" → "la ciudad" → "el entreno", each rolling up through a mask.
// - Each portrait develops like film: a curtain wipe uncovers it while the picture settles from a zoom.
// - The two columns drift at slightly different speeds.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { q, qa } from './util';

export function moments(wide: boolean) {
  const section = q('#momentos');
  if (!section) return;
  const items = qa('[data-moment]', section);

  // ---------- heading: rises in; on desktop its last words change with the pictures ----------
  const title = q('[data-moments-title]', section);
  if (title) {
    gsap.from(title.children, { yPercent: 60, autoAlpha: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: title, start: 'top 88%', once: true } });
    const words = qa('[data-swap-word]', title);
    if (wide && words.length > 1) {
      gsap.set(words.slice(1), { yPercent: 105, visibility: 'visible' });
      let current = 0;
      const show = (n: number) => {
        if (n === current || !words[n]) return;
        const dir = n > current ? 1 : -1;
        gsap.to(words[current], { yPercent: -105 * dir, duration: 0.7, ease: 'expo.inOut', overwrite: true });
        gsap.fromTo(words[n], { yPercent: 105 * dir }, { yPercent: 0, duration: 0.7, ease: 'expo.inOut', overwrite: true });
        current = n;
      };
      // The pictures sit in two staggered columns, so each one takes over as its top crosses the
      // middle of the screen (in reading order), and gives back when scrolled up past it.
      items.forEach((item, i) =>
        ScrollTrigger.create({
          trigger: item,
          start: 'top 60%',
          onEnter: () => show(i + 1),
          onLeaveBack: () => show(i),
        }),
      );
    }
  }

  // ---------- portraits: curtain wipe + settle, then the caption ----------
  items.forEach((item) => {
    const shot = q('.moment__shot', item);
    const inner = q('.shot__draw, picture', item);
    const caption = qa(':scope > h3, :scope > p, :scope > a', item);
    if (!shot) return;
    gsap.set(shot, { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(caption, { autoAlpha: 0, y: 16 });
    ScrollTrigger.create({
      trigger: item,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(shot, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' });
        gsap.to(caption, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, delay: 0.55 });
      },
    });
    if (inner) {
      gsap.fromTo(inner, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: item, start: 'top bottom', end: 'center 40%', scrub: 0.6 } });
    }
  });

  // ---------- the two columns drift apart a little (desktop) ----------
  if (wide) {
    const grid = q('.moments__grid', section);
    qa('.moment--1, .moment--3', section).forEach((el) =>
      gsap.fromTo(el, { y: 70 }, { y: -70, ease: 'none', scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom top', scrub: 0.8 } }),
    );
  }
}
