// A pair of sunglasses built from code: rims, bridge, lenses and temples,
// for any shape in lib/outline.ts and any frame and lens in lib/palette.ts.
import * as THREE from 'three';
import type { PairSpec } from '../lib/palette';
import { bounds, edgeAt, lensCentre, lensOutline, offset, type Pt } from '../lib/outline';
import { frameMaterial, lensMaterial } from './materials';

const WRAP = 0.075; // how much the front curves back towards the temples

/** Bends a geometry around the face: the further from the middle, the further back. */
function wrap(geo: THREE.BufferGeometry) {
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    p.setZ(i, p.getZ(i) - WRAP * x * x);
  }
  p.needsUpdate = true;
}
const wrapZ = (x: number) => -WRAP * x * x;

const mirrorX = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [-x, y] as Pt).reverse();
const shift = (pts: Pt[], dx: number): Pt[] => pts.map(([x, y]) => [x + dx, y] as Pt);
const toShape = (pts: Pt[]) => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));

function rim(outer: Pt[], inner: Pt[], depth: number) {
  const s = toShape(outer);
  s.holes.push(new THREE.Path(inner.map(([x, y]) => new THREE.Vector2(x, y))));
  const g = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.22,
    bevelSize: Math.min(0.012, depth * 0.2),
    bevelSegments: 3,
    curveSegments: 1,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** A lens as rings from the centre to the edge, so it can be domed. */
function lensGeometry(pts: Pt[], cx: number, dome: number) {
  const rings = 8;
  const n = pts.length;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const b = bounds(pts);
  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;
  pos.push(cx, 0, dome);
  uv.push(0.5, (0 - b.minY) / h);
  for (let k = 1; k <= rings; k++) {
    const f = k / rings;
    for (const [x, y] of pts) {
      pos.push(cx + x * f, y * f, dome * (1 - f * f));
      uv.push((x * f - b.minX) / w, (y * f - b.minY) / h);
    }
  }
  for (let i = 0; i < n; i++) idx.push(0, 1 + i, 1 + ((i + 1) % n));
  for (let k = 1; k < rings; k++) {
    const a0 = 1 + (k - 1) * n;
    const a1 = 1 + k * n;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      idx.push(a0 + i, a1 + i, a1 + j, a0 + i, a1 + j, a0 + j);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  wrap(g);
  g.computeVertexNormals();
  return g;
}

function tube(points: THREE.Vector3[], radius: number, flatten = 1) {
  const curve = new THREE.CatmullRomCurve3(points);
  const g = new THREE.TubeGeometry(curve, 48, radius, 10, false);
  if (flatten !== 1) {
    // Squash the round tube into a flat bar, keeping it centred on its path.
    const p = g.attributes.position as THREE.BufferAttribute;
    const c = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      const t = Math.floor(i / 11) / 48;
      curve.getPointAt(Math.min(1, t), c);
      p.setX(i, c.x + (p.getX(i) - c.x) * flatten);
    }
    g.computeVertexNormals();
  }
  return g;
}

export interface Pair {
  group: THREE.Group;
  /** Width of the front, for framing. */
  width: number;
  dispose(): void;
}

export function buildPair(spec: PairSpec): Pair {
  const { shape, frame, lens } = spec;
  const metal = frame.kind === 'metal';
  const fMat = frameMaterial(frame);
  const lMat = lensMaterial(lens);
  const group = new THREE.Group();
  const front = new THREE.Group();
  group.add(front);

  const outline = lensOutline(shape);
  const b = bounds(outline);
  const cx = lensCentre(shape);
  const rimW = metal ? 0.03 : 0.058;
  const depth = metal ? 0.034 : 0.085;
  // Acetate rims are heavier along the brow.
  const rimAt = ([x, y]: Pt) => {
    if (metal) return rimW;
    const brow = 1 + 0.55 * Math.max(0, y / b.maxY) ** 2;
    const wing = shape === 'cateye' ? 1 + 1.2 * Math.max(0, x / b.maxX) ** 3 * Math.max(0, y / b.maxY) : 1;
    return rimW * brow * wing;
  };
  const outerR = offset(outline, rimAt);
  const lensPts = offset(outline, rimW * 0.35);

  const geos: THREE.BufferGeometry[] = [];
  const add = (g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D = front) => {
    geos.push(g);
    const mesh = new THREE.Mesh(g, m);
    parent.add(mesh);
    return mesh;
  };

  for (const side of [1, -1]) {
    const o = side === 1 ? shift(outerR, cx) : shift(mirrorX(outerR), -cx);
    const i = side === 1 ? shift(outline, cx) : shift(mirrorX(outline), -cx);
    const g = rim(o, i, depth);
    wrap(g);
    add(g, fMat);
    const lp = side === 1 ? lensPts : mirrorX(lensPts);
    add(lensGeometry(lp, side * cx, 0.045), lMat);
  }

  // Bridge
  if (metal) {
    const y = b.maxY * 0.32;
    const e = cx - edgeAt(outline, y, 'inner') - rimW * 0.3;
    const pts = [
      new THREE.Vector3(-e, y, wrapZ(e)),
      new THREE.Vector3(0, y + 0.07, 0.015),
      new THREE.Vector3(e, y, wrapZ(e)),
    ];
    add(tube(pts, 0.017), fMat);
    if (shape === 'aviator' || shape === 'square') {
      const yt = b.maxY * 0.86;
      const et = cx - edgeAt(outline, yt, 'inner') - rimW * 0.2;
      add(tube([new THREE.Vector3(-et, yt, wrapZ(et)), new THREE.Vector3(0, yt + 0.01, 0.01), new THREE.Vector3(et, yt, wrapZ(et))], 0.014), fMat);
    }
    // Nose pads
    const padMat = new THREE.MeshPhysicalMaterial({ color: '#f4f1ea', roughness: 0.15, transmission: 0, transparent: true, opacity: 0.75 });
    for (const side of [1, -1]) {
      const px = side * (cx - edgeAt(outline, -b.maxY * 0.15, 'inner') + 0.06);
      const pad = add(new THREE.SphereGeometry(0.055, 16, 12), padMat);
      pad.scale.set(0.45, 1, 0.3);
      pad.position.set(px, -b.maxY * 0.15, wrapZ(px) - 0.12);
      pad.rotation.y = side * 0.5;
    }
  } else {
    const y1 = b.maxY * 0.62;
    const y0 = b.maxY * 0.08;
    const e1 = cx - edgeAt(outline, y1, 'inner') - rimW * 0.55;
    const e0 = cx - edgeAt(outline, y0, 'inner') - rimW * 0.55;
    const s = new THREE.Shape();
    s.moveTo(-e1, y1 + rimW * 0.5);
    s.lineTo(e1, y1 + rimW * 0.5);
    s.lineTo(e0, y0);
    s.quadraticCurveTo(0, y0 + 0.13, -e0, y0);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: depth * 0.9, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 2 });
    g.translate(0, 0, -depth * 0.45);
    wrap(g);
    add(g, fMat);
  }

  // Hinges and temples
  const hy = b.maxY * (shape === 'cateye' ? 0.5 : shape === 'aviator' ? 0.62 : 0.4);
  for (const side of [1, -1]) {
    const hx = side * (cx + edgeAt(outerR, hy, 'outer') - rimW * 0.15);
    const hz = wrapZ(hx);
    const arm = new THREE.Group();
    arm.position.set(hx, hy, hz - depth * 0.3);
    arm.rotation.y = side * 0.07; // temples open slightly wider than the face
    group.add(arm);
    if (!metal) {
      const block = add(new THREE.BoxGeometry(rimW * 1.1, 0.13, 0.16), fMat, arm);
      block.position.set(-side * rimW * 0.2, 0, -0.06);
    }
    const L = 1.55;
    const path = [
      new THREE.Vector3(0, 0, -0.04),
      new THREE.Vector3(0, -0.01, -L * 0.45),
      new THREE.Vector3(0, -0.03, -L * 0.82),
      new THREE.Vector3(0, -0.13, -L * 0.96),
      new THREE.Vector3(0, -0.3, -L * 1.06),
    ];
    if (metal) {
      add(tube(path.slice(0, 4), 0.014), fMat, arm);
      // Acetate tip over the end of a metal temple.
      const tipMat = new THREE.MeshPhysicalMaterial({ color: frame.hex === '#c9a35b' ? '#3a2a1c' : '#1e1f22', roughness: 0.3, clearcoat: 0.6 });
      add(tube(path.slice(2), 0.022), tipMat, arm);
    } else {
      add(tube(path, 0.05, 0.5), fMat, arm);
    }
  }

  // Centre the pair on its own front.
  front.position.z = 0;
  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = false;
      o.receiveShadow = false;
    }
  });
  const width = 2 * (cx + b.maxX + rimW);

  return {
    group,
    width,
    dispose() {
      geos.forEach((g) => g.dispose());
      group.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | undefined;
        if (m) {
          const map = (m as THREE.MeshPhysicalMaterial).map;
          map?.dispose();
          m.dispose();
        }
      });
    },
  };
}
