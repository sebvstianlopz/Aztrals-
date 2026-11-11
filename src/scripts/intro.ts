// The loading screen. Whether it shows at all is decided before first paint by the inline script
// in Base.astro (html.intro-on); this plays it and then lifts it.
//
// The sequence:
// 1. AZTRALS scrambles through random characters and settles letter by letter.
// 2. Each letter turns into a dot or a yellow sparkle, in place.
// 3. The row draws together and curls into a ring that spins while the page finishes loading.
// 4. The ring flies into the logo's starburst while the lettering is drawn in from the left, the
//    starburst pops and the sparkles twinkle on.
// 5. A short hold, then the screen slides up and the hero starts typing (aztrals:intro-done).
// Click, Enter, Esc, Space or scrolling skips it at any point.
import { gsap } from 'gsap';
import { logo } from '../components/brand/logo';

const root = document.documentElement;
const intro = document.querySelector<HTMLElement>('[data-intro]');

if (intro && root.classList.contains('intro-on')) {
  const page = document.querySelectorAll<HTMLElement>('[data-inert-with-bag]');
  page.forEach((el) => (el.inert = true));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let tl: gsap.core.Timeline | null = null;
  let spin: gsap.core.Tween | null = null;

  let closing = false;
  const onKey = (e: KeyboardEvent) => {
    if (['Escape', 'Enter', ' ', 'ArrowDown', 'PageDown'].includes(e.key)) {
      e.preventDefault();
      close();
    }
  };
  const close = () => {
    if (closing) return;
    closing = true;
    root.classList.add('intro-leaving');
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      tl?.kill();
      spin?.kill();
      intro.remove();
      root.classList.remove('intro-on', 'intro-leaving');
      page.forEach((el) => (el.inert = false));
      window.removeEventListener('keydown', onKey);
      window.dispatchEvent(new Event('aztrals:intro-done'));
    };
    intro.addEventListener('transitionend', (e) => e.target === intro && finish());
    setTimeout(finish, 1100); // in case the transition never fires
  };

  intro.addEventListener('click', close);
  window.addEventListener('keydown', onKey);
  window.addEventListener('wheel', close, { once: true, passive: true });
  window.addEventListener('touchmove', close, { once: true, passive: true });

  if (reduced) {
    setTimeout(close, 1400);
  } else {
    play();
  }

  function play() {
    const word = intro!.querySelector<HTMLElement>('[data-intro-word]')!;
    const letters = [...word.querySelectorAll<HTMLElement>('span')];
    const dotsBox = intro!.querySelector<HTMLElement>('[data-intro-dots]')!;
    const dots = [...dotsBox.querySelectorAll<HTMLElement>('.intro__dot')];
    const logoBox = intro!.querySelector<HTMLElement>('[data-intro-logo]')!;
    const lettering = intro!.querySelector<SVGElement>('[data-intro-lettering]')!;
    const burst = intro!.querySelector<SVGElement>('[data-intro-burst]')!;
    const sparks = [...intro!.querySelectorAll<SVGElement>('[data-intro-spark]')];

    const loaded = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', () => resolve(), { once: true });
    });

    // 1. Scramble. Each letter cycles through random characters until its turn to settle.
    const pool = 'AZTRLS0123456789';
    const settle = letters.map((_, i) => 0.3 + i * 0.09);
    let last = -1;
    const scramble = { p: 0 };

    gsap.set(lettering, { '--wipe': '-20%' });
    gsap.set([burst, ...sparks], { transformOrigin: '50% 50%', scale: 0, opacity: 0 });

    tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
    tl.from(letters, { opacity: 0, y: 14, duration: 0.35, stagger: 0.035, ease: 'power3.out' }, 0)
      .to(
        scramble,
        {
          p: 1,
          duration: 1.05,
          ease: 'none',
          onUpdate() {
            const frame = Math.floor(scramble.p * 22);
            if (frame === last) return;
            last = frame;
            letters.forEach((el, i) => {
              el.textContent = scramble.p >= settle[i] ? el.dataset.ch! : pool[(Math.random() * pool.length) | 0];
            });
          },
        },
        0,
      )
      // 2. Letters become dots and sparkles, each in its letter's place.
      .add(() => {
        const box = dotsBox.getBoundingClientRect();
        letters.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          gsap.set(dots[i], { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top });
        });
      }, 1.3)
      .to(letters, { scale: 0.2, opacity: 0, duration: 0.28, stagger: 0.03, ease: 'power2.in' }, 1.3)
      .fromTo(dots, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.03, ease: 'back.out(2.4)' }, 1.4)
      // 3. The row draws together, then curls into a ring.
      .to(dots, { x: (i) => (i - 3) * 30, y: 0, duration: 0.5, stagger: { each: 0.02, from: 'edges' } }, 1.95)
      .to(
        dots,
        {
          x: (i) => Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / dots.length) * 44,
          y: (i) => Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / dots.length) * 44,
          // Smaller toward the tail, like a comet chasing its head round the ring.
          scale: (i) => 0.45 + (0.55 * (i + 1)) / dots.length,
          duration: 0.65,
          stagger: 0.025,
        },
        2.5,
      )
      .add(() => {
        spin = gsap.to(dotsBox, { rotation: '+=360', duration: 1.1, ease: 'none', repeat: -1 });
      }, 2.55)
      .addPause(3.39, () => {
        // Keep spinning until the page has loaded: at least the rest of one turn, at most ~2.5 s more.
        const cap = new Promise((r) => setTimeout(r, 2500));
        Promise.race([loaded, cap]).then(() => {
          if (!closing) tl?.play();
        });
      });

    // 4. Into the logo.
    tl.add(() => {
      const b = logoBox.getBoundingClientRect();
      const d = dotsBox.getBoundingClientRect();
      const tx = b.left + (logo.burst.x / logo.width) * b.width - d.left;
      const ty = b.top + (logo.burst.y / logo.height) * b.height - d.top;
      gsap.to(dotsBox, { x: tx, y: ty, scale: 0.35, duration: 0.6, ease: 'power3.inOut' });
    }, 3.4)
      .set(logoBox, { visibility: 'visible' }, 3.4)
      .fromTo(logoBox, { scale: 0.96 }, { scale: 1, duration: 1.6, ease: 'power2.out' }, 3.4)
      .to(lettering, { '--wipe': '120%', duration: 0.85, ease: 'power2.inOut' }, 3.4)
      .to(dots, { scale: 0, opacity: 0, duration: 0.2, stagger: 0.015, ease: 'power2.in' }, 3.85)
      .to(burst, { scale: 1, opacity: 1, rotation: 0, duration: 0.55, ease: 'back.out(2.2)', startAt: { rotation: -120 } }, 3.95)
      .to(sparks, { scale: 1, opacity: 1, rotation: 0, duration: 0.45, stagger: 0.07, ease: 'back.out(3)', startAt: { rotation: 60 } }, 4.1)
      // A quick twinkle once they're all on.
      .to(sparks, { scale: 1.25, duration: 0.18, stagger: 0.06, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 4.75)
      // 5. Hold, then lift.
      .add(close, 5.5);
  }
} else {
  intro?.remove();
}
