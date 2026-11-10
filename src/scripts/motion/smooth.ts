// Smooth, weighted scrolling on desktop (Lenis), kept in step with ScrollTrigger.
// Phones and touch screens keep their native scrolling. The bag drawer pauses it while open.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function smooth() {
  const lenis = new Lenis({ lerp: 0.1, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  const raf = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  const lock = () => lenis.stop();
  const unlock = () => lenis.start();
  window.addEventListener('aztrals:scroll-lock', lock);
  window.addEventListener('aztrals:scroll-unlock', unlock);
  return () => {
    window.removeEventListener('aztrals:scroll-lock', lock);
    window.removeEventListener('aztrals:scroll-unlock', unlock);
    gsap.ticker.remove(raf);
    lenis.destroy();
  };
}
