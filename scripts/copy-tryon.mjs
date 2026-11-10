// Copies the MediaPipe vision engine (WebAssembly) from node_modules into public/tryon/wasm, so the
// camera try-on loads it from this site instead of a CDN. Runs before `dev` and `build`.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, 'node_modules/@mediapipe/tasks-vision/wasm');
const to = join(root, 'public/tryon/wasm');
if (!existsSync(from)) {
  console.warn('[tryon] @mediapipe/tasks-vision not installed; skipping');
  process.exit(0);
}
mkdirSync(to, { recursive: true });
for (const f of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm']) copyFileSync(join(from, f), join(to, f));
console.log('[tryon] copied the face-tracking engine to public/tryon/wasm');
