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
  /** Folds the temples behind the lenses: 0 = open, 1 = folded. */
  setFold(f: number): void;
  /** Fades the whole pair: 1 = as made, 0 = invisible. */
  setOpacity(o: number): void;
  dispose(): void;
}

export function buildPair(spec: PairSpec): Pair {
  if (spec.shape === 'shield') return buildShield(spec);
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
  const arms: { arm: THREE.Group; side: number; y: number }[] = [];
  const hy = b.maxY * (shape === 'cateye' ? 0.5 : shape === 'aviator' ? 0.62 : 0.4);
  for (const side of [1, -1]) {
    const hx = side * (cx + edgeAt(outerR, hy, 'outer') - rimW * 0.15);
    const hz = wrapZ(hx);
    const arm = new THREE.Group();
    arm.position.set(hx, hy, hz - depth * 0.3);
    arm.rotation.y = side * 0.07; // temples open slightly wider than the face
    group.add(arm);
    arms.push({ arm, side, y: hy });
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

  const width = 2 * (cx + b.maxX + rimW);
  return finishPair(group, geos, arms, width);
}

/** What every pair shares once built: folding temples, fading, cleaning up. */
function finishPair(group: THREE.Group, geos: THREE.BufferGeometry[], arms: { arm: THREE.Group; side: number; y: number }[], width: number): Pair {
  // Remember each material's own opacity, so fading can scale it.
  const mats = new Set<THREE.Material>();
  group.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (m) mats.add(m);
  });
  mats.forEach((m) => (m.userData.baseOpacity = m.opacity));

  return {
    group,
    width,
    setFold(f) {
      for (const { arm, side, y } of arms) {
        // The left temple folds a touch further and lower, so the two lie on each other.
        const extra = side < 0 ? 0.08 : 0;
        arm.rotation.y = side * (0.07 + f * (Math.PI / 2 - 0.2 + extra));
        arm.position.y = y - (side < 0 ? f * 0.05 : 0);
      }
    },
    setOpacity(o) {
      mats.forEach((m) => {
        const base = m.userData.baseOpacity ?? 1;
        m.transparent = o < 1 || base < 1;
        m.opacity = base * o;
        m.depthWrite = o >= 1 && base >= 1;
      });
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      group.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | undefined;
        if (m) {
          const mm = m as THREE.MeshPhysicalMaterial;
          mm.map?.dispose();
          mm.emissiveMap?.dispose();
          m.dispose();
        }
      });
    },
  };
}

// ——— Sport shield ———————————————————————————————————————————————————————————————
// One wide lens across both eyes with a cut-out for the nose, held by a brow bar along the top
// and a bridge around the nose; wraps further round the face than the other shapes.

const SHIELD_WRAP = 0.15;
const swrap = (geo: THREE.BufferGeometry, dz = 0) => {
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    p.setZ(i, p.getZ(i) - SHIELD_WRAP * x * x + dz);
  }
  p.needsUpdate = true;
};
const swrapZ = (x: number) => -SHIELD_WRAP * x * x;

/** Height of the lens's top edge at x. */
const shieldTop = (x: number) => 0.27 - 0.025 * (x / 1.3) ** 2;

/** The right half of the lens, from the top of the centre line round the eye to the nose. */
function shieldHalf(): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= 12; i++) {
    const x = (1.3 * i) / 12;
    pts.push([x, shieldTop(x)]);
  }
  // The rest of the edge as one smooth curve through these points.
  const knots: Pt[] = [
    [1.3, shieldTop(1.3)], [1.36, 0.2], [1.39, 0.08], [1.37, -0.06], [1.31, -0.2], [1.21, -0.33], [1.07, -0.43],
    [0.9, -0.5], [0.72, -0.54], [0.55, -0.53], [0.42, -0.48], [0.34, -0.39],
    ...SHIELD_NOTCH.slice().reverse(),
  ];
  const curve = new THREE.SplineCurve(knots.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const p of curve.getSpacedPoints(90).slice(1)) pts.push([p.x, p.y]);
  return pts;
}

/** The nose cut-out on the right half, from the top of the nose downwards. */
const SHIELD_NOTCH: Pt[] = [[0, 0.04], [0.06, 0.03], [0.13, -0.01], [0.21, -0.1], [0.27, -0.24], [0.32, -0.36]];

/** One half of the lens as rings around a point inside it; uv spans the whole shield. */
function shieldLensHalf(side: 1 | -1) {
  const half = shieldHalf();
  const centre: Pt = [0.72, -0.12];
  const rings = 10;
  const pts = side === 1 ? half.slice().reverse() : half.map(([x, y]) => [-x, y] as Pt);
  const c: Pt = [side * centre[0], centre[1]];
  const W = 1.4;
  const minY = -0.56;
  const maxY = 0.28;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const put = (x: number, y: number) => {
    pos.push(x, y, 0);
    uv.push((x + W) / (2 * W), (y - minY) / (maxY - minY));
  };
  put(c[0], c[1]);
  const n = pts.length;
  for (let k = 1; k <= rings; k++) {
    const f = k / rings;
    for (const [x, y] of pts) put(c[0] + (x - c[0]) * f, c[1] + (y - c[1]) * f);
  }
  for (let i = 0; i < n - 1; i++) idx.push(0, 1 + i, 2 + i);
  for (let k = 1; k < rings; k++) {
    const a0 = 1 + (k - 1) * n;
    const a1 = 1 + k * n;
    for (let i = 0; i < n - 1; i++) idx.push(a0 + i, a1 + i, a1 + i + 1, a0 + i, a1 + i + 1, a0 + i + 1);
  }
  // Close the ring across the centre line.
  idx.push(0, n, 1);
  for (let k = 1; k < rings; k++) {
    const a0 = 1 + (k - 1) * n;
    const a1 = 1 + k * n;
    idx.push(a0 + n - 1, a1 + n - 1, a1, a0 + n - 1, a1, a0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  swrap(g);
  g.computeVertexNormals();
  return g;
}

/** Offsets an open polyline sideways by d (positive = to the left of travel). */
function offsetOpen(pts: Pt[], d: number): Pt[] {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    return [p[0] - ty * d, p[1] + tx * d] as Pt;
  });
}

function buildShield(spec: PairSpec): Pair {
  const { frame, lens } = spec;
  const fMat = frameMaterial(frame);
  const lMat = lensMaterial(lens);
  const padMat = new THREE.MeshPhysicalMaterial({ color: '#1d1d20', roughness: 0.65, clearcoat: 0.2 });
  const group = new THREE.Group();
  const front = new THREE.Group();
  group.add(front);
  const geos: THREE.BufferGeometry[] = [];
  const add = (g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D = front) => {
    geos.push(g);
    const mesh = new THREE.Mesh(g, m);
    parent.add(mesh);
    return mesh;
  };

  // The lens, in two halves that meet on the centre line.
  add(shieldLensHalf(1), lMat);
  add(shieldLensHalf(-1), lMat);

  // Brow bar along the top, thickening into an end piece at each side.
  const END = 1.44;
  const top: Pt[] = [];
  const bottom: Pt[] = [];
  for (let i = 0; i <= 40; i++) {
    const x = -1.34 + (2.68 * i) / 40;
    const dip = 0.012 * Math.exp(-((x / 0.18) ** 2)); // a slight dip over the nose
    top.push([x, shieldTop(x) + 0.05 - dip]);
    bottom.push([x, shieldTop(x) - 0.02]);
  }
  const brow: Pt[] = [
    [-END, 0.15], [-END + 0.03, 0.25], ...top, [END - 0.03, 0.25], [END, 0.15], [END - 0.03, 0.05], [1.34, 0.05],
    ...bottom.slice().reverse(), [-1.34, 0.05], [-END + 0.03, 0.05],
  ];
  // Extrusion normals are kept (not recomputed) so the bevels stay rounded rather than faceted.
  const browGeo = new THREE.ExtrudeGeometry(toShape(brow), { depth: 0.05, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.032, bevelSegments: 8, curveSegments: 1 });
  browGeo.translate(0, 0, -0.03);
  swrap(browGeo);
  add(browGeo, fMat);

  // Bridge: a band round the nose cut-out, in front of the lens.
  const notch: Pt[] = [...SHIELD_NOTCH.slice(1).reverse().map(([x, y]) => [-x, y] as Pt), ...SHIELD_NOTCH];
  const inner = offsetOpen(notch, 0.012);
  const outer = offsetOpen(notch, -0.07);
  const bridgeGeo = new THREE.ExtrudeGeometry(toShape([...outer, ...inner.slice().reverse()]), { depth: 0.05, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.018, bevelSegments: 5, curveSegments: 1 });
  swrap(bridgeGeo);
  add(bridgeGeo, fMat);

  // Rubber nose pads behind the bridge.
  for (const side of [1, -1]) {
    const pad = add(new THREE.CapsuleGeometry(0.035, 0.16, 6, 12), padMat);
    pad.position.set(side * 0.27, -0.3, swrapZ(0.27) - 0.06);
    pad.rotation.set(0.2, 0, side * 0.35);
  }

  // Temples from the end pieces.
  const arms: { arm: THREE.Group; side: number; y: number }[] = [];
  const hy = 0.15;
  for (const side of [1, -1]) {
    const hx = side * (END - 0.02);
    const arm = new THREE.Group();
    arm.position.set(hx, hy, swrapZ(hx) - 0.03);
    arm.rotation.y = side * 0.07;
    group.add(arm);
    arms.push({ arm, side, y: hy });
    const L = 1.5;
    const path = [
      new THREE.Vector3(0, 0, -0.02),
      new THREE.Vector3(0, -0.01, -L * 0.45),
      new THREE.Vector3(0, -0.03, -L * 0.82),
      new THREE.Vector3(0, -0.12, -L * 0.96),
      new THREE.Vector3(0, -0.26, -L * 1.05),
    ];
    add(tube(path, 0.06, 0.45), fMat, arm);
  }

  return finishPair(group, geos, arms, 2 * END + 0.05);
}
