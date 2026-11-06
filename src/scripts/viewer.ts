// Product page: the 3D pair, the colour choice and the quantity.
import type { FrameId, LensId, Shape } from '../lib/palette';

type V = { id: string; spec: { shape: Shape; frame: FrameId; lens: LensId } };

export function initViewer() {
  const product = document.querySelector<HTMLElement>('.product');
  if (!product) return;
  const canvas = product.querySelector<HTMLCanvasElement>('.stage')!;
  const poster = product.querySelector<HTMLImageElement>('.poster')!;
  const variants: V[] = JSON.parse(canvas.dataset.variants || '[]');
  const add = product.querySelector<HTMLButtonElement>('.add')!;
  const wa = product.querySelector<HTMLAnchorElement>('.wa')!;
  const vname = product.querySelector<HTMLElement>('.vname')!;
  const radios = product.querySelectorAll<HTMLInputElement>('input[name="variant"]');
  let stage: import('../three/stage').Stage | null = null;
  let toSpec: ((v: V) => import('../lib/palette').PairSpec) | null = null;

  const choose = (input: HTMLInputElement, push = true) => {
    input.checked = true;
    const id = input.value;
    product.style.setProperty('--field', input.dataset.field || '');
    poster.src = input.dataset.poster || poster.src;
    poster.alt = poster.alt.split(',')[0] + ', ' + (input.dataset.name || '');
    add.dataset.add = `${add.dataset.add!.split('|')[0]}|${id}`;
    wa.href = input.dataset.wa || wa.href;
    vname.textContent = input.dataset.name || '';
    const v = variants.find((x) => x.id === id);
    if (stage && toSpec && v) stage.change(toSpec(v));
    if (push) {
      const u = new URL(location.href);
      u.searchParams.set('v', id);
      history.replaceState(null, '', u);
    }
  };
  radios.forEach((r) => r.addEventListener('change', () => choose(r)));
  const wanted = new URL(location.href).searchParams.get('v');
  const start = Array.from(radios).find((r) => r.value === wanted);
  if (start) choose(start, false);

  // Quantity stepper
  const qty = product.querySelector<HTMLInputElement>('#qty')!;
  product.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((b) =>
    b.addEventListener('click', () => {
      qty.value = String(Math.max(1, Math.min(20, (Number(qty.value) || 1) + Number(b.dataset.step))));
    }),
  );

  const boot = async () => {
    const [{ Stage, webglAvailable }, { spec }] = await Promise.all([import('../three/stage'), import('../lib/palette')]);
    if (!webglAvailable()) return;
    try {
      stage = new Stage(canvas, { draggable: true, yaw: -0.55, pitch: 0.14, fill: innerWidth > 900 ? 0.7 : 0.82 });
    } catch {
      return;
    }
    toSpec = (v) => spec(v.spec.shape, v.spec.frame, v.spec.lens);
    const current = Array.from(radios).find((r) => r.checked)?.value;
    stage.setPair(toSpec(variants.find((v) => v.id === current) ?? variants[0]));
    requestAnimationFrame(() => product.classList.add('live'));
    product.querySelectorAll<HTMLButtonElement>('[data-turn]').forEach((b) => b.addEventListener('click', () => stage?.nudge(Number(b.dataset.turn) * 0.6)));
  };
  if ('requestIdleCallback' in window) requestIdleCallback(() => boot(), { timeout: 600 });
  else setTimeout(boot, 150);
}
