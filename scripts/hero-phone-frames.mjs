// Makes the phone copies of the home hero's frames: public/hero/frames/*.webp (1200×900)
// → public/hero/frames-phone/*.webp (800×600). Run by `npm run hero-frames`, or on its own after
// replacing the full-size frames:  node scripts/hero-phone-frames.mjs
import { mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

export const PHONE_WIDTH = 800;

export async function makePhoneFrames(root = join(dirname(fileURLToPath(import.meta.url)), '..')) {
  const src = join(root, 'public/hero/frames');
  const out = join(root, 'public/hero/frames-phone');
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  const files = (await readdir(src)).filter((f) => f.endsWith('.webp')).sort();
  // A few at a time keeps memory flat.
  for (let i = 0; i < files.length; i += 8) {
    await Promise.all(
      files.slice(i, i + 8).map((f) =>
        sharp(join(src, f))
          .resize({ width: PHONE_WIDTH, kernel: 'lanczos3' })
          .webp({ quality: 78, alphaQuality: 80, effort: 6 })
          .toFile(join(out, f)),
      ),
    );
  }
  console.log(`${files.length} phone frames saved to public/hero/frames-phone/`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await makePhoneFrames();
