// Renders every pair in every colourway to public/products/<slug>/<variant>.webp.
// Run after adding or changing a pair:  npm run posters   (or: npm run posters -- condado)
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Needs Playwright with Chromium: npm i -D playwright && npx playwright install chromium
const { chromium } = createRequire(import.meta.url)('playwright');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv[2] ?? '';
const port = 4399;

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
  const base = process.env.BASE_PATH ?? '/Aztrals-';
  await page.goto(`http://localhost:${port}${base}/render/${only ? `?only=${only}` : ''}`.replace(/\/\/render/, '/render'));
  await page.waitForFunction(() => document.title === 'done', null, { timeout: 300_000 });
  const posters = await page.evaluate(() => window.__posters);
  for (const [key, url] of Object.entries(posters)) {
    const file = join(root, 'public/products', `${key}.webp`);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log('saved', key);
  }
} finally {
  await browser.close();
  stop();
}
