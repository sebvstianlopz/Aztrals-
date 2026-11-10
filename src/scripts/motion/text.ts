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

/**
 * Types the text of `el` out letter by letter with a blinking caret that follows the last letter.
 * The rhythm is a little uneven, with a short pause between words, so it reads as typing.
 * Returns the timeline; the caret stays at the end, blinking, until `removeCaret()` is called.
 */
export function typeOn(el: HTMLElement, { speed = 0.065, wordPause = 0.09, caretClass = 'type-caret' } = {}) {
  const split = SplitText.create(el, { type: 'words,chars', charsClass: 'type-char' });
  const chars = split.chars as HTMLElement[];
  const caret = document.createElement('span');
  caret.className = caretClass;
  caret.setAttribute('aria-hidden', 'true');
  gsap.set(chars, { autoAlpha: 0 });
  gsap.set(el, { autoAlpha: 1, visibility: 'visible' });

  const tl = gsap.timeline({
    onStart: () => chars[0]?.before(caret),
  });
  let t = 0;
  chars.forEach((ch, i) => {
    tl.set(ch, { autoAlpha: 1 }, t);
    tl.call(() => ch.after(caret), [], t);
    const next = chars[i + 1];
    const newWord = next && next.parentElement !== ch.parentElement;
    t += speed * (0.7 + Math.random() * 0.6) + (newWord ? wordPause : 0);
  });
  return Object.assign(tl, { removeCaret: () => gsap.to(caret, { autoAlpha: 0, duration: 0.3, onComplete: () => caret.remove() }) });
}
