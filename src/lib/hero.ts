// The home hero's frame sequence (rendered by `npm run hero-frames`).
export const HERO_FRAMES = 240;

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

/** URL of frame i (1-based). */
export const heroFrame = (i: number) => `${base}hero/frames/frame_${String(i).padStart(4, '0')}.webp`;
