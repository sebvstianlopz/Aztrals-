// Text reveals: headline lines rising through a mask, and words or letters rising into place.
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

/**
 * Splits a heading into lines, each inside a mask, and slides them up one after another.
 * With `onScroll` (default) it plays once when the heading comes into view.
 */
export function riseLines(el: HTMLElement, { delay = 0, onScroll = true } = {}) {
  return SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'split-line',
    autoSplit: true,
    onSplit(self) {
      gsap.set(el, { visibility: 'visible' });
      return gsap.from(self.lines, {
        yPercent: 115,
        duration: 1.15,
        ease: 'expo.out',
        stagger: 0.08,
        delay,
        scrollTrigger: onScroll ? { trigger: el, start: 'top 88%', once: true } : undefined,
      });
    },
  });
}

/** Splits into letters, leaves them hidden and returns them for the caller to animate. */
export function splitChars(el: HTMLElement) {
  const split = SplitText.create(el, { type: 'chars', charsClass: 'split-char' });
  gsap.set(split.chars, { yPercent: 70, autoAlpha: 0 });
  gsap.set(el, { autoAlpha: 1 });
  return split.chars as HTMLElement[];
}

/** Letters rise one after another. */
export const riseChars = (chars: Element[], vars: gsap.TweenVars = {}) =>
  gsap.to(chars, { yPercent: 0, autoAlpha: 1, duration: 1.2, ease: 'expo.out', stagger: 0.05, ...vars });
