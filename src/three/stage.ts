// One WebGL stage per canvas: light, reflections, a pair of sunglasses and how it moves.
import * as THREE from 'three';
import type { PairSpec } from '../lib/palette';
import { buildPair, type Pair } from './glasses';

export interface StageOptions {
  /** Drag to turn the pair (product page). */
  draggable?: boolean;
  /** Gentle sway and float while idle. */
  idle?: boolean;
  /** Follow the pointer across the whole window. */
  followPointer?: boolean;
  /** Keep pixels after drawing so the canvas can be saved as an image. */
  capture?: boolean;
  /** Turn of the pair at rest, in radians (0 = straight on). */
  yaw?: number;
  pitch?: number;
  /** Share of the frame's width the pair fills. */
  fill?: number;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** A soft Caribbean sky and sea, with a few bright panels and a sun, for the lenses to reflect. */
function environment(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(20, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `varying vec3 vP;
        void main(){
          float h = vP.y;
          vec3 top = vec3(0.32, 0.55, 0.86);
          vec3 hor = vec3(1.0, 0.96, 0.9);
          vec3 sea = vec3(0.05, 0.32, 0.4);
          vec3 c = h > 0.0 ? mix(hor, top, pow(h, 0.55)) : mix(hor * 0.9, sea, pow(-h, 0.35));
          gl_FragColor = vec4(c * 1.15, 1.0);
        }`,
    }),
  );
  scene.add(sky);
  const panel = (w: number, h: number, pos: THREE.Vector3, k: number) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide }),
    );
    m.position.copy(pos);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  panel(9, 1.6, new THREE.Vector3(0, 7, 5), 5);
  panel(1.6, 7, new THREE.Vector3(-8, 1, 4), 3);
  panel(1.4, 6, new THREE.Vector3(8, 0, -2), 2.4);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(14, 12, 9) }));
  sun.position.set(5, 8, 9);
  scene.add(sun);
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(scene, 0.035);
  pm.dispose();
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
  });
  return rt;
}

export class Stage {
  readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  private holder = new THREE.Group();
  private turn = new THREE.Group();
  private env: THREE.WebGLRenderTarget;
  private pair: Pair | null = null;
  private opts: Required<StageOptions>;
  private raf = 0;
  private running = false;
  private visible = true;
  private last = 0;
  private elapsed = 0;
  private pointer = new THREE.Vector2();
  private pointerSmooth = new THREE.Vector2();
  private dragYaw = 0;
  private dragPitch = 0;
  private dragVel = 0;
  private dragging = false;
  private swap: { from: number; next: PairSpec; t0: number; swapped: boolean; resolve: () => void } | null = null;
  private swapYaw = 0;
  private ro: ResizeObserver;
  private io: IntersectionObserver;
  private cleanups: (() => void)[] = [];
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(canvas: HTMLCanvasElement, opts: StageOptions = {}) {
    this.canvas = canvas;
    this.opts = { draggable: false, idle: true, followPointer: false, capture: false, yaw: -0.5, pitch: 0.12, fill: 0.78, ...opts };
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: this.opts.capture,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.env = environment(this.renderer);
    this.scene.environment = this.env.texture;
    const key = new THREE.DirectionalLight(0xfff4e6, 1.4);
    key.position.set(3, 5, 6);
    this.scene.add(key);
    this.scene.add(this.holder);
    this.holder.add(this.turn);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.sync();
    }, { rootMargin: '120px' });
    this.io.observe(canvas);
    const onVis = () => this.sync();
    document.addEventListener('visibilitychange', onVis);
    this.cleanups.push(() => document.removeEventListener('visibilitychange', onVis));

    if (this.opts.followPointer && !this.reduced) {
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        this.pointer.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
      };
      addEventListener('pointermove', onMove, { passive: true });
      this.cleanups.push(() => removeEventListener('pointermove', onMove));
    }
    if (this.opts.draggable) this.enableDrag();
    this.resize();
  }

  private enableDrag() {
    const c = this.canvas;
    let lastX = 0, lastY = 0, lastT = 0;
    c.style.touchAction = 'pan-y';
    c.style.cursor = 'grab';
    const down = (e: PointerEvent) => {
      this.dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = performance.now();
      c.setPointerCapture(e.pointerId);
      c.style.cursor = 'grabbing';
      this.sync();
    };
    const move = (e: PointerEvent) => {
      if (!this.dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const now = performance.now();
      this.dragYaw += dx * 0.009;
      this.dragPitch = THREE.MathUtils.clamp(this.dragPitch + dy * 0.005, -0.5, 0.6);
      this.dragVel = (dx * 0.009) / Math.max(8, now - lastT) * 16;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = now;
    };
    const up = (e: PointerEvent) => {
      this.dragging = false;
      c.style.cursor = 'grab';
      if (c.hasPointerCapture(e.pointerId)) c.releasePointerCapture(e.pointerId);
    };
    c.addEventListener('pointerdown', down);
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    // Keyboard: arrow keys turn the pair.
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') this.dragYaw -= 0.3;
      else if (e.key === 'ArrowRight') this.dragYaw += 0.3;
      else return;
      e.preventDefault();
      this.sync();
    };
    c.addEventListener('keydown', key);
  }

  /** Sets the resting turn of the pair and draws it at once (used to render spin frames). */
  pose(yaw: number, pitch = this.opts.pitch) {
    this.opts.yaw = yaw;
    this.opts.pitch = pitch;
    this.turn.rotation.set(pitch, yaw, 0);
    this.holder.position.y = 0;
    this.holder.rotation.z = 0;
    this.render();
  }

  /** Turn the pair by hand, e.g. from a button. */
  nudge(yaw: number) {
    this.dragYaw += yaw;
    this.sync();
  }

  private resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(devicePixelRatio || 1, w < 700 ? 1.75 : 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.frame();
    this.camera.updateProjectionMatrix();
    this.render();
  }

  /** Moves the camera back until the pair fills `fill` of the frame's width (or 70% of its height). */
  private frame() {
    const width = (this.pair?.width ?? 2.6) * 1.02;
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * this.camera.aspect);
    const byW = width / 2 / Math.tan(hfov / 2) / this.opts.fill;
    const byH = 1.25 / 2 / Math.tan(vfov / 2) / 0.7;
    const d = Math.max(byW, byH);
    this.camera.position.set(0, 0.05, d);
    this.camera.lookAt(0, 0, -0.5);
  }

  setPair(spec: PairSpec) {
    if (this.pair) {
      this.turn.remove(this.pair.group);
      this.pair.dispose();
    }
    this.pair = buildPair(spec);
    this.pair.group.position.z = 0.55; // turn around the middle of the temples, not the front
    this.turn.add(this.pair.group);
    this.turn.position.z = -0.55;
    this.frame();
    this.camera.updateProjectionMatrix();
    this.render();
  }

  /** Turns the current pair edge-on, swaps it for the next one and turns that one back. */
  change(spec: PairSpec): Promise<void> {
    if (!this.pair || this.reduced) {
      this.setPair(spec);
      return Promise.resolve();
    }
    if (this.swap) {
      this.swap.next = spec;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.swap = { from: this.swapYaw, next: spec, t0: performance.now(), swapped: false, resolve };
      this.sync();
    });
  }

  private sync() {
    const should = this.visible && !document.hidden;
    if (should && !this.running) {
      this.running = true;
      this.last = performance.now();
      const loop = () => {
        if (!this.running) return;
        this.tick();
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    } else if (!should && this.running) {
      this.running = false;
      cancelAnimationFrame(this.raf);
    }
  }

  private tick() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.elapsed += dt;
    const t = this.elapsed;
    const idle = this.opts.idle && !this.reduced;

    if (this.swap) {
      const s = this.swap;
      const k = Math.min(1, (performance.now() - s.t0) / 1100);
      if (k < 0.45) this.swapYaw = ease(k / 0.45) * (Math.PI / 2);
      else {
        if (!s.swapped) {
          s.swapped = true;
          this.setPair(s.next);
        }
        this.swapYaw = -Math.PI / 2 + ease((k - 0.45) / 0.55) * (Math.PI / 2);
      }
      if (k >= 1) {
        this.swapYaw = 0;
        this.swap = null;
        s.resolve();
      }
    }

    if (!this.dragging && this.dragVel) {
      this.dragYaw += this.dragVel;
      this.dragVel *= 0.92;
      if (Math.abs(this.dragVel) < 0.0005) this.dragVel = 0;
    }
    this.pointerSmooth.lerp(this.pointer, 1 - Math.exp(-dt * 3));
    const sway = idle ? Math.sin(t * 0.32) * 0.28 : 0;
    this.turn.rotation.y = this.opts.yaw + sway + this.dragYaw + this.swapYaw + this.pointerSmooth.x * 0.35;
    this.turn.rotation.x = this.opts.pitch + this.dragPitch + this.pointerSmooth.y * 0.16;
    this.holder.position.y = idle ? Math.sin(t * 0.7) * 0.035 : 0;
    this.holder.rotation.z = idle ? Math.sin(t * 0.45) * 0.015 : 0;
    this.render();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /** The current frame as an image, for posters. */
  snapshot(type = 'image/webp', quality = 0.92) {
    this.render();
    return this.canvas.toDataURL(type, quality);
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
    this.cleanups.forEach((f) => f());
    this.pair?.dispose();
    this.env.dispose();
    this.renderer.dispose();
  }
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
