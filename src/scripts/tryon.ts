// Camera try-on. A full-screen mirror where the chosen glasses follow the visitor's face.
//
// - Face tracking: Google MediaPipe Face Landmarker, run entirely in the browser (WebAssembly,
//   GPU when available). The engine and the model are served from this site (public/tryon/), and
//   they are only downloaded when someone opens the try-on.
// - The glasses are placed from the two iris points: centred between them, sized to their
//   distance, and turned with the head's tilt. Position, size and angle are smoothed so the
//   glasses don't jitter.
// - Without a camera (or if permission is refused) the visitor can upload a photo instead.
// - Nothing leaves the device: frames are read from the camera, drawn on a canvas and dropped.
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

// ---------- the face tracker, loaded once on first use ----------
let tracker: Promise<FaceLandmarker> | null = null;
let trackerMode: 'VIDEO' | 'IMAGE' = 'VIDEO';

function getTracker(): Promise<FaceLandmarker> {
  if (!tracker) {
    tracker = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const files = await FilesetResolver.forVisionTasks(`${base}tryon/wasm`);
      const make = (delegate: 'GPU' | 'CPU') =>
        FaceLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: `${base}tryon/face_landmarker.task`, delegate },
          runningMode: 'VIDEO',
          numFaces: 1,
        });
      try {
        return await make('GPU');
      } catch {
        return await make('CPU');
      }
    })();
    tracker.catch(() => (tracker = null));
  }
  return tracker;
}

async function setMode(lm: FaceLandmarker, mode: 'VIDEO' | 'IMAGE') {
  if (trackerMode === mode) return;
  await lm.setOptions({ runningMode: mode });
  trackerMode = mode;
}

// ---------- glasses artwork ----------
type Art = { img: HTMLImageElement; span: number };
// Distance between the pupils as a fraction of the artwork's width: for the drawings, the lens
// centres sit at 140 and 340 of 480. A try-on photo is cropped to the frame, so with the frame's
// real width known it is sized from the average adult distance between pupils (63 mm).
const SPAN = { drawing: 200 / 480, photo: 0.42 } as const;
const PUPILS_MM = 63;

function loadArt(el: HTMLElement, widthMm?: number): Promise<Art> {
  const kind = (el.dataset.kind as 'drawing' | 'photo') ?? 'drawing';
  const span = kind === 'photo' && widthMm ? PUPILS_MM / widthMm : SPAN[kind];
  const img = new Image();
  if (kind === 'photo') {
    img.src = (el as HTMLImageElement).src;
  } else {
    const svg = el.querySelector('svg')!.cloneNode(true) as SVGSVGElement;
    svg.setAttribute('width', '960');
    svg.setAttribute('height', '380');
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    img.src = URL.createObjectURL(blob);
  }
  return img.decode().then(() => ({ img, span }));
}

// ---------- where the glasses go ----------
type Pose = { x: number; y: number; dist: number; angle: number };

function poseFrom(points: NormalizedLandmark[], w: number, h: number, mirror: boolean): Pose | null {
  // Iris centres (468, 473) when present, otherwise the middle of each eye's corners.
  const mid = (a: number, b: number) => ({ x: (points[a].x + points[b].x) / 2, y: (points[a].y + points[b].y) / 2 });
  const e1 = points[468] ?? mid(33, 133);
  const e2 = points[473] ?? mid(362, 263);
  if (!e1 || !e2) return null;
  const px = (p: { x: number; y: number }) => ({ x: (mirror ? 1 - p.x : p.x) * w, y: p.y * h });
  let [a, b] = [px(e1), px(e2)];
  if (a.x > b.x) [a, b] = [b, a];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, dist: Math.hypot(b.x - a.x, b.y - a.y), angle: Math.atan2(b.y - a.y, b.x - a.x) };
}

const ease = (from: Pose | null, to: Pose, k: number): Pose =>
  from
    ? {
        x: from.x + (to.x - from.x) * k,
        y: from.y + (to.y - from.y) * k,
        dist: from.dist + (to.dist - from.dist) * k,
        angle: from.angle + (to.angle - from.angle) * k,
      }
    : to;

function drawGlasses(ctx: CanvasRenderingContext2D, art: Art, pose: Pose) {
  const w = pose.dist / art.span;
  const h = (w * art.img.naturalHeight) / art.img.naturalWidth;
  ctx.save();
  ctx.translate(pose.x, pose.y + w * 0.015);
  ctx.rotate(pose.angle);
  ctx.drawImage(art.img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

// ---------- one try-on window ----------
class TryOn {
  dialog: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  video: HTMLVideoElement;
  status: HTMLElement;
  arts = new Map<string, Promise<Art>>();
  cw: string;
  stream: MediaStream | null = null;
  raf = 0;
  pose: Pose | null = null;
  missed = 0;
  lastTime = -1;
  photo: ImageBitmap | null = null;
  photoPose: Pose | null = null;
  lastFocus: HTMLElement | null = null;
  // Bumped by every camera start, photo upload and close, so a slow camera answer or a
  // slow photo never lands on top of whatever the visitor did after it.
  run = 0;
  title: string;

  constructor(dialog: HTMLElement) {
    this.dialog = dialog;
    this.canvas = dialog.querySelector('[data-tryon-canvas]')!;
    this.ctx = this.canvas.getContext('2d')!;
    this.video = dialog.querySelector('[data-tryon-video]')!;
    this.status = dialog.querySelector('[data-tryon-status]')!;
    this.title = dialog.querySelector('h2')?.textContent ?? 'Aztrals';
    this.cw = dialog.querySelector<HTMLInputElement>('[data-tryon-cw]:checked')?.value ?? '';

    dialog.querySelectorAll<HTMLElement>('[data-tryon-close]').forEach((b) => b.addEventListener('click', () => this.close()));
    dialog.querySelectorAll<HTMLInputElement>('[data-tryon-cw]').forEach((r) =>
      r.addEventListener('change', () => {
        this.cw = r.value;
        if (this.photo) this.drawPhoto();
      }),
    );
    dialog.querySelector('[data-tryon-shot]')?.addEventListener('click', () => this.shot());
    dialog.querySelector<HTMLInputElement>('[data-tryon-file]')?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) this.usePhoto(file);
      (e.target as HTMLInputElement).value = '';
    });
    dialog.querySelector('[data-tryon-camera]')?.addEventListener('click', () => this.startCamera());
    // Adding to the bag closes the try-on so the bag can open in front.
    dialog.querySelector('[data-add]')?.addEventListener('click', () => this.close());
    dialog.addEventListener('keydown', (e) => this.onKey(e));
  }

  msg(key: string) {
    return this.dialog.dataset[`msg${key[0].toUpperCase()}${key.slice(1).toLowerCase()}`] ?? '';
  }
  say(key: string | null) {
    this.status.textContent = key ? this.msg(key) : '';
  }

  art(id: string) {
    if (!this.arts.has(id)) {
      const el = this.dialog.querySelector<HTMLElement>(`[data-tryon-art="${id}"]`);
      if (el) this.arts.set(id, loadArt(el, Number(this.dialog.dataset.widthMm) || undefined));
    }
    return this.arts.get(id);
  }

  open() {
    this.lastFocus = document.activeElement as HTMLElement;
    // Live outside the page content, so the rest of the page can be made inert behind it.
    if (this.dialog.parentElement !== document.body) document.body.append(this.dialog);
    this.dialog.hidden = false;
    document.querySelectorAll<HTMLElement>('[data-inert-with-bag]').forEach((el) => (el.inert = true));
    document.documentElement.classList.add('tryon-open');
    window.dispatchEvent(new Event('aztrals:scroll-pause'));
    this.dialog.querySelector<HTMLElement>('[data-tryon-close]')?.focus();
    this.dialog.querySelectorAll<HTMLInputElement>('[data-tryon-cw]').forEach((r) => this.art(r.value));
    this.startCamera();
  }

  close() {
    if (this.dialog.hidden) return;
    this.run++;
    this.stopCamera();
    this.photo = null;
    this.dialog.hidden = true;
    document.querySelectorAll<HTMLElement>('[data-inert-with-bag]').forEach((el) => (el.inert = false));
    document.documentElement.classList.remove('tryon-open');
    window.dispatchEvent(new Event('aztrals:scroll-resume'));
    this.lastFocus?.focus({ preventScroll: true });
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      this.close();
    }
    if (e.key === 'Tab') {
      const items = [...this.dialog.querySelectorAll<HTMLElement>('button:not([hidden]), input, [href]')].filter((el) => el.offsetParent !== null || el.matches('input[type=file]'));
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  async startCamera() {
    const run = ++this.run;
    const stale = () => run !== this.run || this.dialog.hidden;
    this.stopCamera();
    this.photo = null;
    this.canvas.classList.remove('is-photo');
    this.pose = null;
    this.dialog.querySelector<HTMLElement>('[data-tryon-camera]')!.hidden = true;
    this.say('loading');
    let lm: FaceLandmarker;
    try {
      lm = await getTracker();
    } catch (err) {
      console.error(err);
      this.say('failed');
      return;
    }
    if (stale()) return;
    if (!navigator.mediaDevices?.getUserMedia) return this.say('noCamera');
    this.say('camera');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
    } catch {
      if (!stale()) this.say('noCamera');
      return;
    }
    if (stale()) return stream.getTracks().forEach((t) => t.stop());
    this.stream = stream;
    this.video.srcObject = stream;
    await this.video.play().catch(() => {});
    await setMode(lm, 'VIDEO');
    if (stale()) return;
    this.say('searching');
    this.missed = 0;
    this.lastTime = -1;
    const loop = async () => {
      if (stale()) return;
      this.raf = requestAnimationFrame(loop);
      const v = this.video;
      if (v.readyState < 2 || !v.videoWidth) return;
      if (this.canvas.width !== v.videoWidth) {
        this.canvas.width = v.videoWidth;
        this.canvas.height = v.videoHeight;
      }
      const { width: w, height: h } = this.canvas;
      // Mirror view, like a mirror or a selfie camera.
      this.ctx.save();
      this.ctx.translate(w, 0);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(v, 0, 0, w, h);
      this.ctx.restore();
      if (v.currentTime !== this.lastTime) {
        this.lastTime = v.currentTime;
        const res = lm.detectForVideo(v, performance.now());
        const face = res.faceLandmarks[0];
        const next = face ? poseFrom(face, w, h, true) : null;
        if (next) {
          this.pose = ease(this.pose, next, 0.45);
          this.missed = 0;
          if (this.status.textContent) this.say(null);
        } else if (++this.missed > 20) {
          this.pose = null;
          this.say('searching');
        }
      }
      const art = await this.art(this.cw);
      if (this.pose && art && !stale()) drawGlasses(this.ctx, art, this.pose);
    };
    loop();
  }

  stopCamera() {
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video.srcObject = null;
  }

  async usePhoto(file: File) {
    const run = ++this.run;
    this.stopCamera();
    this.say('loading');
    let lm: FaceLandmarker;
    let photo: ImageBitmap;
    try {
      lm = await getTracker();
      photo = await createImageBitmap(file);
    } catch (err) {
      console.error(err);
      if (run === this.run) this.say('failed');
      return;
    }
    if (run !== this.run) return;
    this.photo = photo;
    // Large photos are scaled down to at most 1600px on the long side.
    const s = Math.min(1, 1600 / Math.max(this.photo.width, this.photo.height));
    this.canvas.width = Math.round(this.photo.width * s);
    this.canvas.height = Math.round(this.photo.height * s);
    this.canvas.classList.add('is-photo');
    this.ctx.drawImage(this.photo, 0, 0, this.canvas.width, this.canvas.height);
    await setMode(lm, 'IMAGE');
    if (run !== this.run) return;
    const face = lm.detect(this.canvas).faceLandmarks[0];
    this.photoPose = face ? poseFrom(face, this.canvas.width, this.canvas.height, false) : null;
    this.dialog.querySelector<HTMLElement>('[data-tryon-camera]')!.hidden = false;
    this.say(this.photoPose ? null : 'noFace');
    this.drawPhoto();
  }

  async drawPhoto() {
    if (!this.photo) return;
    this.ctx.drawImage(this.photo, 0, 0, this.canvas.width, this.canvas.height);
    const art = await this.art(this.cw);
    if (this.photoPose && art) drawGlasses(this.ctx, art, this.photoPose);
  }

  shot() {
    if (!this.canvas.width) return;
    this.dialog.querySelector('.tryon__stage')?.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
    this.canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `aztrals-${this.dialog.dataset.tryonDialog}.png`, { type: 'image/png' });
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: this.title });
          return;
        }
      } catch {
        /* sharing cancelled: fall back to a download */
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      this.say('saved');
      setTimeout(() => this.status.textContent === this.msg('saved') && this.say(null), 1800);
    }, 'image/png');
  }
}

// ---------- wiring ----------
const windows = new Map<string, TryOn>();
document.querySelectorAll<HTMLElement>('[data-tryon-dialog]').forEach((d) => windows.set(d.dataset.tryonDialog!, new TryOn(d)));
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-tryon-open]');
  if (!btn) return;
  const w = windows.get(btn.dataset.tryonOpen!);
  if (!w) return;
  // Start with the colour the visitor already picked, if any.
  const picked = btn.closest('[data-spot], [data-cw-scope]')?.querySelector<HTMLInputElement>('[data-cw-input]:checked')?.value;
  if (picked) {
    const r = w.dialog.querySelector<HTMLInputElement>(`[data-tryon-cw][value="${picked}"]`);
    if (r) {
      r.checked = true;
      w.cw = picked;
    }
  }
  w.open();
});
