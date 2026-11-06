// Renders the home hero's frame sequence to public/hero/frames/frame_0001.webp …
// Run after changing the season's pairs:  npm run hero-frames
import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { makePhoneFrames } from './hero-phone-frames.mjs';

// Needs Playwright with Chromium: npm i -D playwright && npx playwright install chromium
const { chromium } = createRequire(import.meta.url)('playwright');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = 4398;
// Optional preview: npm run hero-frames -- 0,0.1,0.2  (writes only those points, to public/hero/preview/)
const at = process.argv[2] ?? '';
const base = (process.env.BASE_PATH ?? '/Aztrals-').replace(/\/$/, '');

const dev = spawn('npx', ['astro', 'dev', '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
const stop = () => { try { process.kill(-dev.pid, 'SIGTERM'); } catch { dev.kill(); } };
await new Promise((resolve, reject) => {
  const onData = (d) => String(d).includes('ready in') && resolve();
  dev.stdout.on('data', onData);
  dev.stderr.on('data', onData);
  dev.on('exit', () => reject(new Error('astro dev stopped')));
});

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  page.on('console', (m) => m.type() === 'error' && console.error('page:', m.text()));
  const out = join(root, at ? 'public/hero/preview' : 'public/hero/frames');
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await page.exposeFunction('saveFrame', async (n, url) => {
    await writeFile(join(out, `frame_${String(n).padStart(4, '0')}.webp`), Buffer.from(url.split(',')[1], 'base64'));
    if (n % 50 === 0) console.log('frame', n);
  });
  await page.goto(`http://localhost:${port}${base}/render-hero/${at ? `?at=${at}` : ''}`);
  await page.waitForFunction(() => document.title === 'done', null, { timeout: 900_000 });
  console.log(`saved to ${out}`);
} finally {
  await browser.close();
  stop();
}
if (!at) await makePhoneFrames(root);
