// The home hero's scene: the season's pairs lie folded in a loose pile. As the visitor scrolls,
// the top pair lifts, turns to face them, unfolds its temples, holds, then tips back and flies up
// out of the frame, and the pile rises to bring the next pair up. Rendered to frames at build
// time (scripts/render-hero-page.astro); nothing here runs on visitors' devices.
import * as THREE from 'three';
import type { PairSpec } from '../lib/palette';
import { buildPair, type Pair } from './glasses';
import { environment } from './stage';

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t * t * t;
/** Progress of t through [a, b], eased. */
const span = (t: number, a: number, b: number, f = ease) => f(clamp((t - a) / (b - a)));
const mix = (a: number, b: number, k: number) => a + (b - a) * k;

// The pile: each pair a little lower and turned its own way, like things set down by hand.
const GAP = 0.36;
const TOP_Y = -0.35;
const FAN = [
  { yaw: -0.34, x: 0.06, roll: 0.06, lean: 0.14 },
  { yaw: 0.28, x: -0.12, roll: -0.08, lean: -0.1 },
  { yaw: -0.14, x: 0.14, roll: 0.05, lean: 0.12 },
  { yaw: 0.4, x: -0.08, roll: -0.06, lean: -0.08 },
];
// Where a lifted pair holds while the visitor reads its card.
const SHOW = { y: 0.62, z: 1.35 };

export class PileScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(24, 4 / 3, 0.1, 100);
  private pairs: { pair: Pair; holder: THREE.Group; tilt: THREE.Group }[] = [];

  constructor(canvas: HTMLCanvasElement, specs: PairSpec[]) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.environment = environment(this.renderer).texture;

    const key = new THREE.DirectionalLight(0xfff4e6, 1.6);
    key.position.set(2.5, 7, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    key.shadow.radius = 6;
    key.shadow.bias = -0.0008;
    this.scene.add(key);

    this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera.position.set(0, 6.3, 9.9);
    this.camera.lookAt(0, 0.35, 0);
    this.camera.updateProjectionMatrix();

    specs.forEach((spec) => {
      const pair = buildPair(spec);
      pair.group.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      // holder: position and turn in the room; tilt: lying down versus standing up.
      const holder = new THREE.Group();
      const tilt = new THREE.Group();
      tilt.add(pair.group);
      holder.add(tilt);
      this.scene.add(holder);
      this.pairs.push({ pair, holder, tilt });
    });
  }

  /** Poses every pair for a point in the scroll, 0 (pile at rest) to 1 (all gone). */
  pose(progress: number) {
    const n = this.pairs.length;
    const active = Math.min(n - 1, Math.floor(progress * n));
    const t = progress * n - active; // progress through the active pair's quarter
    const leave = span(t, 0.72, 1, easeIn); // the active pair flying away
    const rise = active < n ? span(t, 0.76, 1) : 0; // the pile coming up a place

    this.pairs.forEach(({ pair, holder, tilt }, i) => {
      const fan = FAN[i % FAN.length];
      if (i < active || (i === active && progress >= 1)) {
        holder.visible = false;
        return;
      }
      holder.visible = true;
      if (i > active) {
        // Still in the pile: folded, lying lens-up, rising one place as the pair above leaves.
        const slot = i - active - rise;
        holder.position.set(fan.x, TOP_Y - slot * GAP, -slot * 0.05);
        holder.rotation.set(0, fan.yaw, fan.roll);
        tilt.rotation.set(-Math.PI / 2 + fan.lean, 0, 0);
        pair.setFold(1);
        pair.setOpacity(1);
        return;
      }
      // The active pair.
      const lift = span(t, 0, 0.3); // up off the pile and upright
      const open = span(t, 0.12, 0.42); // temples unfold
      const turn = span(t, 0.28, 0.74, (x) => x); // slow turn while it holds
      const y = mix(TOP_Y, SHOW.y, lift) + leave * 4.2 + Math.sin(Math.PI * clamp((t - 0.3) / 0.42)) * 0.04;
      const z = mix(0, SHOW.z, lift) - leave * 1.2;
      holder.position.set(mix(fan.x, 0, lift), y, z);
      const yaw = mix(fan.yaw, -0.42, lift) + turn * 0.62 + leave * 0.5;
      holder.rotation.set(0, yaw, mix(fan.roll, 0, lift));
      // Lying (-90°) to standing slightly towards us (+6°), then tipping back as it flies.
      tilt.rotation.set(mix(-Math.PI / 2 + fan.lean, 0.18, lift) - leave * 1.25, 0, 0);
      pair.setFold(1 - open);
      pair.setOpacity(1 - span(t, 0.84, 0.99, (x) => x));
    });
    this.renderer.render(this.scene, this.camera);
  }

  snapshot(type = 'image/webp', quality = 0.82) {
    return this.renderer.domElement.toDataURL(type, quality);
  }
}
