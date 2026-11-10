// The ending.
// - "Tu próxima vista empieza aquí": the lines rise through their masks, then, tied to the scroll,
//   each line develops from dim Olive to bright Bone, left to right, like a tinted lens lifting.
// - The footer's giant AZTRALS rises letter by letter, echoing the hero.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { riseChars, splitChars } from './text';
import { q, qa } from './util';

export function close() {
  const title = q('[data-close-title]');
  if (title) {
    gsap.set(title, { autoAlpha: 1 });
    gsap.from(qa('.close__in', title), {
      yPercent: 110,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: title, start: 'top 88%', once: true },
    });
    qa('.close__fill', title).forEach((fill, i) =>
      gsap.fromTo(
        fill,
        { clipPath: 'inset(0% 100% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          ease: 'none',
          scrollTrigger: { trigger: title, start: `top ${78 - i * 6}%`, end: `bottom ${58 - i * 6}%`, scrub: 0.6 },
        },
      ),
    );
  }

  const word = q('[data-foot-word]');
  if (word) {
    const chars = splitChars(word);
    ScrollTrigger.create({ trigger: word, start: 'top 92%', once: true, onEnter: () => riseChars(chars, { duration: 1.3, stagger: 0.06 }) });
  }
}
