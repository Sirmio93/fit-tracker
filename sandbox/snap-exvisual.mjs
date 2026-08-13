// Quick showcase of ExerciseVisual identity states/sizes for Phase 2.3.
// Renders a grid of size × status combinations against known asset slugs.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'screenshots');

const HTML = `<!doctype html>
<html lang="it" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ExerciseVisual — Phase 2.3</title>
  <link rel="stylesheet" href="../components/index.css">
  <style>
    body { font-family: system-ui, sans-serif; background: #0A0A0B; color: #EFEFEF; margin: 0; padding: 24px; }
    h1 { font-size: 16px; letter-spacing: .1em; text-transform: uppercase; opacity: .6; margin: 24px 0 12px; }
    .row { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; margin-bottom: 24px; }
    figure { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    figcaption { font-size: 11px; opacity: .55; letter-spacing: .06em; text-transform: uppercase; }
    .box { width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; }
    .box--sm { width: 100px; height: 100px; }
    .box--mini { width: 60px; height: 60px; }
  </style>
</head>
<body>
  <h1>MINI (48) · category=push · statuses</h1>
  <div class="row" id="row-mini"></div>

  <h1>SM (~88) · known slug · category badge · statuses</h1>
  <div class="row" id="row-sm"></div>

  <h1>MD (~200) · badge + title + difficulty · statuses</h1>
  <div class="row" id="row-md"></div>

  <h1>LG (~320) · workout hero · isCurrent=true</h1>
  <div class="row" id="row-lg"></div>

  <script type="module">
    import { ExerciseVisual } from '../components/Exercise/ExerciseVisual.js';

    const STATUSES = ['upcoming', 'current', 'completed', 'locked'];

    const mount = (id, size, extra = {}) => {
      const el = document.getElementById(id);
      STATUSES.forEach(status => {
        const fig = document.createElement('figure');
        const boxCls = size === 'mini' ? 'box box--mini' : (size === 'sm' ? 'box box--sm' : 'box');
        fig.innerHTML = \`
          <div class="\${boxCls}">\${ExerciseVisual({ name: 'Bench Press', size, status, ...extra })}</div>
          <figcaption>\${status}</figcaption>
        \`;
        el.appendChild(fig);
      });
    };

    mount('row-mini', 'mini');
    mount('row-sm',   'sm');
    mount('row-md',   'md', { difficulty: 3 });

    const lg = document.getElementById('row-lg');
    ['Bench Press', 'Squat', 'Deadlift'].forEach(name => {
      const fig = document.createElement('figure');
      fig.innerHTML = \`
        <div style="width:320px;height:320px;display:flex;align-items:center;justify-content:center;">
          \${ExerciseVisual({ name, size: 'lg', isCurrent: true })}
        </div>
        <figcaption>\${name}</figcaption>
      \`;
      lg.appendChild(fig);
    });
  </script>
</body>
</html>`;

const target = path.join(__dirname, '__exvisual.html');
const fs = await import('node:fs/promises');
await fs.writeFile(target, HTML, 'utf8');

const BASE = 'http://127.0.0.1:8765/sandbox/__exvisual.html';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 1800 }, colorScheme: 'dark' });
page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
page.on('console', (msg) => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });

await page.goto(BASE, { waitUntil: 'load' });
await page.waitForTimeout(600);
const out = path.join(OUT, 'phase23-exvisual-showcase.png');
await page.screenshot({ path: out, fullPage: true });
console.log('SAVED', out);
await browser.close();
await fs.rm(target).catch(() => {});
