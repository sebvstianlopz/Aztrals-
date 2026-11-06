// The home page's pinned story: which chapter is in view, and the 3D pair that goes with it.
import type { Shape, FrameId, LensId } from '../lib/palette';

type S = { shape: Shape; frame: FrameId; lens: LensId };

export function initStory() {
  const story = document.querySelector<HTMLElement>('.story');
  if (!story) return;
  const canvas = story.querySelector<HTMLCanvasElement>('.stage')!;
  const specs: S[] = JSON.parse(canvas.dataset.specs || '[]');
  const places = story.querySelectorAll<HTMLElement>('.place');
  const fields = Array.from(places).map((p) => p.style.getPropertyValue('--field'));
  let active = 0;
  let stage: import('../three/stage').Stage | null = null;
  let toSpec: ((s: S) => import('../lib/palette').PairSpec) | null = null;

  const set = (i: number) => {
    if (i === active) return;
    active = i;
    story.dataset.active = String(i);
    story.style.setProperty('--field', fields[i]);
    if (stage && toSpec) stage.change(toSpec(specs[i]));
  };

  const steps = story.querySelectorAll<HTMLElement>('.step');
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) set(Number((e.target as HTMLElement).dataset.i));
    },
    { rootMargin: '-50% 0px -50% 0px' },
  );
  steps.forEach((s) => io.observe(s));

  story.querySelectorAll<HTMLAnchorElement>('.chapters a').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const i = Number(a.dataset.i);
      const top = story.offsetTop + i * innerHeight + 2;
      scrollTo({ top, behavior: document.documentElement.classList.contains('motion') ? 'smooth' : 'auto' });
    }),
  );

  // The 3D pair, loaded after first paint. Without WebGL the posters stay.
  const boot = async () => {
    const [{ Stage, webglAvailable }, { spec }] = await Promise.all([import('../three/stage'), import('../lib/palette')]);
    if (!webglAvailable()) return;
    const wide = innerWidth > 900;
    try {
      stage = new Stage(canvas, { followPointer: true, yaw: -0.5, pitch: 0.14, fill: wide ? 0.44 : 0.88 });
    } catch {
      return;
    }
    toSpec = (s) => spec(s.shape, s.frame, s.lens);
    stage.setPair(toSpec(specs[active]));
    requestAnimationFrame(() => story.classList.add('live'));
  };
  if ('requestIdleCallback' in window) requestIdleCallback(() => boot(), { timeout: 800 });
  else setTimeout(boot, 200);
}
