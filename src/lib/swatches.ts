// Colours used to draw frames and lenses until real photos replace the drawings,
// and for the colour dots on tiles and in the bag.
import type { FRAMES, TINTS } from '../content.config';

export type Frame = (typeof FRAMES)[number];
export type Tint = (typeof TINTS)[number];

export const frameColor: Record<Frame, string> = {
  negro: '#161514',
  hueso: '#E2D9C8',
  plata: '#B8BBBE',
  carey: '#6A3E22',
  arena: '#C8B28C',
  oliva: '#575B39',
};

export const tintColor: Record<Tint, string> = {
  humo: '#2B2C2F',
  sol: '#F0541E',
  ambar: '#C8762A',
  oceano: '#1E5C78',
  verde: '#2E4935',
  rosa: '#C4867F',
};
