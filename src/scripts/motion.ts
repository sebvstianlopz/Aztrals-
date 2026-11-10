// The motion layer: GSAP + ScrollTrigger (+ SplitText, Flip, Lenis), only when the visitor has not
// asked for reduced motion. Every element starts visible in the HTML; hidden start states are set
// by CSS under html.motion and by these modules, and if this script fails the inline guard in
// Base.astro removes html.motion so everything shows.
//
// One module per part of the page, in src/scripts/motion/.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { reveals } from './motion/reveals';
import { headings } from './motion/headings';
import { hero } from './motion/hero';
import { visor } from './motion/visor';
import { spotlight } from './motion/spotlight';
import { moments } from './motion/moments';
import { releases } from './motion/releases';
import { smooth } from './motion/smooth';
import { collection } from './motion/collection';

const root = document.documentElement;

if (root.classList.contains('motion')) {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  // While the intro screen is up, hold everything until it lifts, so the hero plays as the page is
  // revealed instead of behind the intro.
  if (root.classList.contains('intro-on')) window.addEventListener('aztrals:intro-done', start, { once: true });
  else start();
  root.classList.add('motion-ready');
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

function start() {
  const mm = gsap.matchMedia();
  mm.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      wide: '(min-width: 901px)',
      fine: '(hover: hover) and (pointer: fine)',
    },
    (ctx) => {
      const { motion, wide, fine } = ctx.conditions as { motion: boolean; wide: boolean; fine: boolean };
      if (!motion) return;
      const cleanups: Array<() => void> = [];
      try {
        if (wide && fine) cleanups.push(smooth());
        reveals();
        headings();
        hero(wide);
        releases(wide);
        visor();
        spotlight(wide);
        moments(wide);
        collection();
      } catch (err) {
        // Never leave content hidden because one effect failed.
        root.classList.remove('motion');
        console.error(err);
      }
      return () => cleanups.forEach((fn) => fn());
    },
  );
}
