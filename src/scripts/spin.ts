// 360° viewers: drag (or arrow keys) to step through the frames. The first frame is in the page;
// the rest load quietly once the viewer is near the screen, then it turns once to show it can.
const done = new WeakSet<HTMLElement>();

export function initSpins(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('.spin.many').forEach((el) => {
    if (done.has(el)) return;
    done.add(el);
    setup(el);
  });
}

function setup(el: HTMLElement) {
  const img = el.querySelector<HTMLImageElement>('.frame')!;
  let frames: string[] = JSON.parse(el.dataset.frames || '[]');
  let i = 0;
  let loaded = false;
  let touched = false;
  const cache = new Map<string, HTMLImageElement>();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const show = (n: number) => {
    i = ((n % frames.length) + frames.length) % frames.length;
    img.src = frames[i];
    el.setAttribute('aria-valuenow', String(i + 1));
  };
  const preload = () =>
    Promise.all(
      frames.map(
        (src) =>
          new Promise<void>((res) => {
            if (cache.has(src)) return res();
            const im = new Image();
            im.decoding = 'async';
            im.onload = im.onerror = () => res();
            im.src = src;
            cache.set(src, im);
          }),
      ),
    );
  const touch = () => {
    touched = true;
    el.classList.add('touched');
  };
  const intro = async () => {
    await preload();
    loaded = true;
    if (reduced || touched) return;
    // One slow turn to show the pair can be turned.
    const start = performance.now();
    const dur = 2600;
    const from = i;
    const step = (now: number) => {
      if (touched) return;
      const k = Math.min(1, (now - start) / dur);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      show(from + Math.round(e * frames.length));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      intro();
    },
    { rootMargin: '200px' },
  );
  io.observe(el);

  // Drag: one full turn across about 1.2 widths of the viewer.
  let x0 = 0;
  let i0 = 0;
  let dragging = false;
  el.addEventListener('pointerdown', (e) => {
    dragging = true;
    touch();
    if (!loaded) preload().then(() => (loaded = true));
    x0 = e.clientX;
    i0 = i;
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const per = (el.clientWidth * 1.2) / frames.length;
    show(i0 - Math.round((e.clientX - x0) / per));
  });
  const end = (e: PointerEvent) => {
    dragging = false;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    touch();
    show(i + (e.key === 'ArrowRight' ? -1 : 1));
  });

  // Swap in another colourway's frames, keeping the same angle.
  el.addEventListener('spin:set', ((e: CustomEvent<{ frames: string[]; alt?: string }>) => {
    const next = e.detail.frames;
    const same = next.length === frames.length;
    frames = next;
    if (e.detail.alt) img.alt = e.detail.alt;
    show(same ? i : 0);
    preload();
  }) as EventListener);
}
