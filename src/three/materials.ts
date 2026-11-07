import * as THREE from 'three';
import type { Frame, Lens } from '../lib/palette';

/** Small deterministic random generator, so a pattern looks the same on every visit. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function tortoise(base: string, spot: string): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 256);
  const r = rng(7);
  g.fillStyle = spot;
  for (let i = 0; i < 90; i++) {
    const x = r() * 256;
    const y = r() * 256;
    const rad = 4 + r() * 18;
    g.globalAlpha = 0.25 + r() * 0.6;
    g.beginPath();
    g.ellipse(x, y, rad * (0.6 + r()), rad * (0.4 + r() * 0.6), r() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 0.55;
  g.fillStyle = '#1d0f07';
  for (let i = 0; i < 50; i++) {
    g.beginPath();
    g.ellipse(r() * 256, r() * 256, 2 + r() * 7, 1.5 + r() * 5, r() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(0.9, 0.9);
  return t;
}

function fade(top: string, bottom: string): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, top);
  grad.addColorStop(0.35, top);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function frameMaterial(f: Frame): THREE.MeshPhysicalMaterial {
  if (f.kind === 'metal') {
    return new THREE.MeshPhysicalMaterial({ color: f.hex, metalness: 1, roughness: 0.24, envMapIntensity: 1.15 });
  }
  return new THREE.MeshPhysicalMaterial({
    color: f.spot ? '#ffffff' : f.hex,
    map: f.spot ? tortoise(f.hex, f.spot) : null,
    metalness: 0,
    roughness: f.matte ? 0.6 : 0.32,
    clearcoat: f.matte ? 0.05 : 0.8,
    clearcoatRoughness: 0.08,
    envMapIntensity: 0.55,
  });
}

/**
 * A rainbow mirror as a texture across the whole shield: warm red at the centre through orange,
 * yellow and green to blue and violet at the edges, darker along the brow, with the logo printed
 * in white above the nose. The texture spans the lens's bounding box (u across, v up).
 */
function rainbow(logo?: string): THREE.Texture {
  const W = 2048;
  const H = 600;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const across = g.createLinearGradient(0, 0, W, 0);
  const stops: [number, string][] = [
    [0, '#5a1fd1'], [0.07, '#2448e0'], [0.15, '#139be0'], [0.23, '#20c464'], [0.31, '#f2d40c'],
    [0.39, '#ff8a00'], [0.46, '#ff3d1a'], [0.5, '#e8174d'],
  ];
  for (const [o, col] of stops) across.addColorStop(o, col);
  for (const [o, col] of stops.slice(0, -1).reverse()) across.addColorStop(1 - o, col);
  g.fillStyle = across;
  g.fillRect(0, 0, W, H);
  // Deeper along the top, as the brow shades it; warmer and brighter towards the bottom.
  const down = g.createLinearGradient(0, 0, 0, H);
  down.addColorStop(0, 'rgba(30, 10, 110, 0.6)');
  down.addColorStop(0.3, 'rgba(30, 10, 110, 0.12)');
  down.addColorStop(0.7, 'rgba(255, 190, 0, 0.0)');
  down.addColorStop(1, 'rgba(255, 190, 0, 0.3)');
  g.fillStyle = down;
  g.fillRect(0, 0, W, H);
  if (logo) {
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '400 92px "UnifrakturMaguntia", "Old English Text MT", serif';
    g.fillText(logo, W / 2, H * 0.2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function lensMaterial(l: Lens): THREE.MeshPhysicalMaterial {
  if (l.rainbow) {
    const map = rainbow(l.logo);
    return new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      map,
      emissive: '#ffffff',
      emissiveMap: map,
      emissiveIntensity: 0.16,
      metalness: 0.75,
      roughness: 0.08,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      iridescence: 0.25,
      envMapIntensity: 1.1,
      side: THREE.DoubleSide,
    });
  }
  if (l.mirror) {
    return new THREE.MeshPhysicalMaterial({
      color: l.hex,
      metalness: 0.92,
      roughness: 0.05,
      iridescence: 0.55,
      iridescenceIOR: 1.5,
      envMapIntensity: 1.6,
      side: THREE.DoubleSide,
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color: l.fade ? '#ffffff' : l.hex,
    map: l.fade ? fade(l.hex, l.fade) : null,
    metalness: 0.1,
    roughness: 0.03,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.5,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}
