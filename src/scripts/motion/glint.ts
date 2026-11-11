// Light catches the lens: a soft band of light sweeps across the model's glasses shortly after the page
// opens, then again every few seconds while the hero is on screen.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { q } from './util';

export function glint() {
  const band = q('[data-glint] span');
  const hero = q('[data-hero]');
  if (!band || !hero) return;
  gsap.set(band, { skewX: -18, xPercent: -180 });
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 7, delay: 1.6 });
  tl.to(band, { xPercent: 620, duration: 1.1, ease: 'power2.inOut' });
  ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', onLeave: () => tl.pause(), onEnterBack: () => tl.resume() });
}
