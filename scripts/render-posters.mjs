// Renders every pair in every colourway from the code-drawn models:
//   public/renders/<pair>/<colourway>/main.webp        the main picture
//   public/renders/<pair>/<colourway>/spin/01…24.webp   the 360° turn
// They stand in until real photos are added (see README). Run after adding or changing a pair:
//   npm run posters            (or: npm run posters -- condado)
import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Needs Playwright with Chromium: npm i -D playwright && npx playwright install chromium
const { chromium } = createRequire(import.meta.url)('playwright');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv[2] ?? '';
const port = 4399;
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
  const page = await browser.newPage({ viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 });
  page.on('console', (m) => m.type() === 'error' && console.error('page:', m.text()));
  const out = join(root, 'public/renders');
  if (only) await rm(join(out, only), { recursive: true, force: true });
  else await rm(out, { recursive: true, force: true });
  let n = 0;
  await page.exposeFunction('saveRender', async (key, url) => {
    const file = join(out, `${key}.webp`);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, Buffer.from(url.split(',')[1], 'base64'));
    if (key.endsWith('/main')) console.log('rendered', key.replace(/\/main$/, ''));
    n++;
  });
  await page.goto(`http://localhost:${port}${base}/render/${only ? `?only=${only}` : ''}`);
  await page.waitForFunction(() => document.title === 'done', null, { timeout: 900_000 });
  console.log(`${n} images saved to public/renders/`);
} finally {
  await browser.close();
  stop();
}
