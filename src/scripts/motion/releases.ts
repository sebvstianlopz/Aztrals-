// "Encuentra tus Aztrals".
// - Each tile's picture is uncovered by a curtain wipe from the bottom while the glasses inside
//   settle from a zoom; large tile first, the rest cascading after it.
// - On desktop the uneven line-up floats: each tile scrolls at its own speed.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { q, qa } from './util';

export function releases(wide: boolean) {
  const row = q('[data-releases-row]');
  if (!row) return;
  const tiles = Array.from(row.children) as HTMLElement[];
  const media = tiles.map((t) => q('.tile__media .shot', t)).filter(Boolean) as HTMLElement[];
  const inner = tiles.map((t) => q('.tile__media .shot__draw svg, .tile__media .shot__img', t)).filter(Boolean) as HTMLElement[];
  const meta = tiles.flatMap((t) => qa('.tile__meta, .tile__foot', t));

  gsap.set(media, { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set(inner, { scale: 1.2 });
  gsap.set(meta, { autoAlpha: 0, y: 14 });
  ScrollTrigger.create({
    trigger: row,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.to(media, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', stagger: 0.12 });
      gsap.to(inner, { scale: 1, duration: 1.8, ease: 'expo.out', stagger: 0.12, delay: 0.2, clearProps: 'transform' });
      gsap.to(meta, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.06, delay: 0.6 });
    },
  });

  if (wide) {
    const speeds = [24, 80, 48, 104];
    tiles.forEach((tile, i) =>
      gsap.fromTo(tile, { y: speeds[i % 4] }, { y: -speeds[i % 4], ease: 'none', scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: 0.8 } }),
    );
  }
}
