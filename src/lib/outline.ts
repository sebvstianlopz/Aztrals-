// The outline of one lens for each frame shape, as a closed polyline.
// Used by the 3D models and by the flat drawings, so both always agree.
// Coordinates: the right-hand lens as seen from the front, centred on (0, 0),
// with the nose towards -x and the temple towards +x. Units: about 50 mm = 1.
import type { Shape } from './palette';

export type Pt = [number, number];

interface Recipe {
  a: number; // half width
  b: number; // half height
  n: number; // superellipse exponent: 2 = ellipse, higher = squarer
  trap?: number; // wider at the top than at the bottom
  lift?: number; // outer top corner pulled up (cat-eye)
  drop?: number; // bottom dips towards the nose (aviator)
  flatTop?: boolean; // straighter brow line
  tilt?: number; // outer side sits higher
}

const recipes: Record<Shape, Recipe> = {
  wayfarer: { a: 0.56, b: 0.41, n: 3.4, trap: 0.24, tilt: 0.07, flatTop: true },
  round: { a: 0.5, b: 0.49, n: 2 },
  cateye: { a: 0.56, b: 0.37, n: 2.4, trap: 0.16, lift: 0.62 },
  aviator: { a: 0.57, b: 0.48, n: 2.05, flatTop: true, drop: 0.38 },
  square: { a: 0.55, b: 0.45, n: 5 },
  oval: { a: 0.58, b: 0.36, n: 2.3 },
  // Sport shields are one wide lens (built in three/glasses.ts); this stands in for flat drawings.
  shield: { a: 0.62, b: 0.36, n: 2.6, trap: 0.1, flatTop: true },
};

const sp = (v: number, e: number) => Math.sign(v) * Math.abs(v) ** e;

export function lensOutline(shape: Shape, segments = 120): Pt[] {
  const r = recipes[shape];
  const pts: Pt[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    let x = r.a * sp(c, 2 / r.n);
    let y = r.b * sp(s, 2 / (r.flatTop && s > 0 ? r.n * 1.9 : r.n));
    if (r.flatTop && s > 0) y *= 0.86;
    if (r.trap) x *= 1 + r.trap * (y / r.b);
    if (r.lift && x > 0 && y > 0) {
      const k = (x / r.a) ** 3 * (y / r.b) ** 1.5;
      y += r.lift * r.b * k;
      x += r.lift * 0.35 * r.a * k;
    }
    if (r.drop && y < 0) {
      const g = Math.exp(-(((x / r.a + 0.3) / 0.6) ** 2));
      y -= r.drop * r.b * g * (-y / r.b);
    }
    if (r.tilt) y += r.tilt * x;
    pts.push([x, y]);
  }
  return pts;
}

/** Moves every point of a closed, counter-clockwise outline outwards by d (inwards if negative). */
export function offset(pts: Pt[], d: number | ((p: Pt) => number)): Pt[] {
  const n = pts.length;
  return pts.map((p, i) => {
    const [px, py] = pts[(i - 1 + n) % n];
    const [nx, ny] = pts[(i + 1) % n];
    let tx = nx - px;
    let ty = ny - py;
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    const k = typeof d === 'function' ? d(p) : d;
    return [p[0] + ty * k, p[1] - tx * k];
  });
}

export function bounds(pts: Pt[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

/** Distance from the lens centre to its edge on the nose side (or temple side) at height y. */
export function edgeAt(pts: Pt[], y: number, side: 'inner' | 'outer'): number {
  let best = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % n];
    if ((y1 - y) * (y2 - y) > 0 || y1 === y2) continue;
    const x = x1 + ((y - y1) / (y2 - y1)) * (x2 - x1);
    if (side === 'inner' ? x < 0 && -x > best : x > 0 && x > best) best = Math.abs(x);
  }
  return best;
}

/** Where the right lens sits on the frame: centre x of the lens. */
export const lensCentre = (shape: Shape) => (shape === 'aviator' ? 0.15 : 0.2) + recipes[shape].a + (shape === 'aviator' ? 0.02 : 0.05);

/** SVG path of both lenses, centred, scaled so the pair is `width` units wide. */
export function pairPath(shape: Shape, width = 100): string {
  const right = lensOutline(shape, 72);
  const cx = lensCentre(shape);
  const total = 2 * (cx + recipes[shape].a * 1.12);
  const k = width / total;
  const ring = (sign: number) =>
    'M' +
    right
      .map(([x, y]) => `${((sign * (x + cx)) * k).toFixed(2)},${(-y * k).toFixed(2)}`)
      .join('L') +
    'Z';
  return ring(1) + ring(-1);
}
