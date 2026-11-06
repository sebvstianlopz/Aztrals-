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

export function lensMaterial(l: Lens): THREE.MeshPhysicalMaterial {
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
