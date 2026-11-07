// The vocabulary of the catalog: every lens tint and frame finish a pair can have.
// Shared by the pages (names, swatches) and the 3D models (colours, materials).

export type Text = { es: string; en: string };

export interface Lens {
  name: Text;
  /** Base colour of the lens. */
  hex: string;
  /** Lighter colour the lens fades to at the bottom, for gradient lenses. */
  fade?: string;
  /** Mirrored coating. */
  mirror?: boolean;
  /** Rainbow mirror (sport shields): colours run from the centre outwards. */
  rainbow?: boolean;
  /** Word printed on the lens, e.g. the brand. */
  logo?: string;
  /** Pale field the pair is shown on, sampled from the lens. */
  field: string;
}

export interface Frame {
  name: Text;
  kind: 'acetate' | 'metal';
  hex: string;
  /** Second colour for patterned acetate (tortoise). */
  spot?: string;
  matte?: boolean;
}

export const lenses = {
  ambar: { name: { es: 'Ámbar', en: 'Amber' }, hex: '#8a4b16', fade: '#c98a3c', field: '#ece3d6' },
  verde: { name: { es: 'Verde mar', en: 'Sea green' }, hex: '#2f4a3a', field: '#dfe7e2' },
  humo: { name: { es: 'Humo', en: 'Smoke' }, hex: '#2c2f34', fade: '#6c7077', field: '#e3e3e1' },
  rosa: { name: { es: 'Rosa atardecer', en: 'Sunset rose' }, hex: '#9c5552', fade: '#dfa79c', field: '#eedfdb' },
  marron: { name: { es: 'Marrón', en: 'Brown' }, hex: '#4a2f1d', fade: '#8a6142', field: '#e8e0d8' },
  'espejo-azul': { name: { es: 'Espejo azul', en: 'Blue mirror' }, hex: '#2f6db0', mirror: true, field: '#dde4ec' },
  'espejo-oro': { name: { es: 'Espejo oro', en: 'Gold mirror' }, hex: '#c2913a', mirror: true, field: '#ede5d6' },
  arcoiris: { name: { es: 'Espejo arcoíris', en: 'Rainbow mirror' }, hex: '#e8577f', mirror: true, rainbow: true, logo: 'aztrals', field: '#f6e4ec' },
} satisfies Record<string, Lens>;

export const frames = {
  negro: { name: { es: 'Negro', en: 'Black' }, kind: 'acetate', hex: '#060607' },
  carey: { name: { es: 'Carey', en: 'Tortoise' }, kind: 'acetate', hex: '#5a3418', spot: '#c08a4a' },
  hueso: { name: { es: 'Hueso', en: 'Bone' }, kind: 'acetate', hex: '#d3bf9e' },
  bosque: { name: { es: 'Verde bosque', en: 'Forest green' }, kind: 'acetate', hex: '#2c3b31', matte: true },
  coral: { name: { es: 'Rojo coral', en: 'Coral red' }, kind: 'acetate', hex: '#8f2f27' },
  arena: { name: { es: 'Arena', en: 'Sand' }, kind: 'acetate', hex: '#b9a184', matte: true },
  rosa: { name: { es: 'Rosa', en: 'Pink' }, kind: 'acetate', hex: '#e95b8e' },
  oro: { name: { es: 'Oro', en: 'Gold' }, kind: 'metal', hex: '#c9a35b' },
  plata: { name: { es: 'Plata', en: 'Silver' }, kind: 'metal', hex: '#c6cacf' },
  grafito: { name: { es: 'Grafito', en: 'Graphite' }, kind: 'metal', hex: '#55585e' },
} satisfies Record<string, Frame>;

export type LensId = keyof typeof lenses;
export type FrameId = keyof typeof frames;

export const shapes = ['wayfarer', 'round', 'cateye', 'aviator', 'square', 'oval', 'shield'] as const;
export type Shape = (typeof shapes)[number];

export const shapeNames: Record<Shape, Text> = {
  wayfarer: { es: 'Wayfarer', en: 'Wayfarer' },
  round: { es: 'Redondo', en: 'Round' },
  cateye: { es: 'Ojo de gato', en: 'Cat-eye' },
  aviator: { es: 'Aviador', en: 'Aviator' },
  square: { es: 'Cuadrado', en: 'Square' },
  oval: { es: 'Ovalado', en: 'Oval' },
  shield: { es: 'Deportivo', en: 'Sport shield' },
};

/** What the 3D model needs to draw one pair in one colourway. */
export interface PairSpec {
  shape: Shape;
  frame: Frame;
  lens: Lens;
}

export const spec = (shape: Shape, frame: FrameId, lens: LensId): PairSpec => ({
  shape,
  frame: frames[frame],
  lens: lenses[lens],
});
