// reel.html を 1 コマずつ seek してスクリーンショットし、ffmpeg で mp4 にする。
//   node render.mjs            → out/ya-syn-reel-16x9.mp4
//   node render.mjs --v        → out/ya-syn-reel-9x16.mp4
//   node render.mjs --stills   → out/stills-*.png（0.5 秒おきの確認用。--at=1.2,3.4 で時刻を指定）
//   node render.mjs --serve    → http://localhost:8790/video/reel.html でプレビュー
// reel.html は trace.json を fetch する。file:// では読めないので、
// リポジトリの根を配る小さなサーバーを立てて、そこから開く。
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpeg from 'ffmpeg-static';
import puppeteer from 'puppeteer-core';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const vertical = process.argv.includes('--v');
const stills = process.argv.includes('--stills');
const serveOnly = process.argv.includes('--serve');
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outDir = join(here, 'out');
mkdirSync(outDir, { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  try {
    const body = readFileSync(join(root, path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
const PORT = 8790;
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
if (serveOnly) {
  console.log(`http://localhost:${PORT}/video/reel.html（?v=1 で 9:16）`);
} else {
  const url = new URL(`http://127.0.0.1:${PORT}/video/reel.html`);
  url.searchParams.set('render', '1');
  if (vertical) url.searchParams.set('v', '1');

  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--font-render-hinting=none'] });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  page.on('console', (m) => m.type() === 'error' && console.error('console', m.text()));
  const [W, H] = vertical ? [1080, 1920] : [1920, 1080];
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(url.href, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !!window.__ready);
  await page.evaluate(() => window.__ready);
  const { DUR, FPS, steps } = await page.evaluate(() => window.__meta);
  if (stills) console.log(`DUR ${DUR}`, JSON.stringify(steps));
  const shot = async (t) => {
    await page.evaluate((x) => window.__render(x), t);
    return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
  };

  if (stills) {
    const tag = vertical ? 'v' : 'h';
    const times = process.argv.find((a) => a.startsWith('--at='))?.slice(5).split(',').map(Number)
      ?? Array.from({ length: Math.ceil(DUR * 2) }, (_, i) => i * 0.5 + 0.25);
    for (const t of times) writeFileSync(join(outDir, `stills-${tag}-${t.toFixed(2).padStart(5, '0')}.png`), await shot(t));
    console.log(`stills → ${outDir}`);
  } else {
    const out = join(outDir, `ya-syn-reel-${vertical ? '9x16' : '16x9'}.mp4`);
    const ff = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const n = Math.round(DUR * FPS);
    for (let f = 0; f < n; f++) {
      const buf = await shot(f / FPS);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (f % FPS === 0) process.stdout.write(`\r${f}/${n}`);
    }
    ff.stdin.end();
    await new Promise((r, j) => ff.on('close', (c) => (c ? j(new Error(`ffmpeg exit ${c}`)) : r())));
    console.log(`\n→ ${out}`);
  }
  await browser.close();
  server.close();
}
