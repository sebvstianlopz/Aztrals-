// The home hero's frame sequence (rendered by `npm run hero-frames`).
export const HERO_FRAMES = 240;

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

/** Screens at or below this width load the smaller phone frames (800×600 instead of 1200×900). */
export const PHONE_QUERY = '(max-width: 760px)';

/** URL of frame i (1-based), full size or the phone copy. */
export const heroFrame = (i: number, phone = false) =>
  `${base}hero/${phone ? 'frames-phone' : 'frames'}/frame_${String(i).padStart(4, '0')}.webp`;
